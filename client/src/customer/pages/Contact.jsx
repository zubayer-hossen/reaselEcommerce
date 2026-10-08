import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, MessageCircle, Mail, MapPin, Facebook, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { api } from '../../api/client.js';
import { useSeo } from '../../hooks/useSeo.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { isValidBdPhone, localized, mapEmbedSrc, safeUrl, toAsciiDigits } from '../../utils/format.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

const CATEGORIES = ['order', 'payment', 'delivery', 'return', 'product', 'other'];
const emptyMsg = { name: '', phone: '', email: '', subject: '', message: '' };
const emptyTicket = { name: '', phone: '', email: '', category: 'order', orderNo: '', subject: '', message: '' };
const area = 'w-full rounded-control border bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function Contact() {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'ticket' ? 'ticket' : 'message';
  const [msg, setMsg] = useState(emptyMsg);
  const [tk, setTk] = useState(emptyTicket);
  const [trap, setTrap] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { ticketNo? }
  const [fail, setFail] = useState('');
  useSeo({ title: `${t('public.contact.title')} | ${siteName}`, description: t('public.contact.subtitle') });

  const c = settings?.contact || {};
  const wa = String(c.whatsapp || '').replace(/[^\d]/g, '');
  const address = localized(c.address, lang);
  const map = mapEmbedSrc(c.mapEmbed);
  const mapLink = safeUrl(c.mapUrl);
  const cards = [
    c.phone && { key: 'call', icon: Phone, label: t('public.contact.call'), value: c.phone, href: `tel:${String(c.phone).replace(/[^\d+]/g, '')}` },
    wa && { key: 'wa', icon: MessageCircle, label: 'WhatsApp', value: c.whatsapp, href: `https://wa.me/${wa}`, ext: true },
    safeUrl(c.messengerUrl) && { key: 'ms', icon: MessageCircle, label: 'Messenger', value: t('public.contact.chat'), href: safeUrl(c.messengerUrl), ext: true },
    safeUrl(c.facebookUrl) && { key: 'fb', icon: Facebook, label: 'Facebook', value: t('public.contact.page'), href: safeUrl(c.facebookUrl), ext: true },
    c.email && { key: 'mail', icon: Mail, label: t('public.contact.email'), value: c.email, href: `mailto:${c.email}` },
  ].filter(Boolean);

  const form = tab === 'ticket' ? tk : msg;
  const setForm = tab === 'ticket' ? setTk : setMsg;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const req = t('public.contact.required');

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = req;
    if (tab === 'ticket') { if (!isValidBdPhone(form.phone)) e.phone = t('public.checkout.badPhone'); }
    else {
      if (form.phone.trim() && !isValidBdPhone(form.phone)) e.phone = t('public.checkout.badPhone');
      if (!form.phone.trim() && !form.email.trim()) e.phone = t('public.contact.needContact');
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = t('public.checkout.badEmail');
    if (form.subject.trim().length < 3) e.subject = req;
    if (form.message.trim().length < 10) e.message = t('public.contact.shortMessage');
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setFail('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return; }
    const body = { ...form, phone: toAsciiDigits(form.phone.trim()), website: trap };
    setBusy(true);
    try {
      const res = tab === 'ticket' ? await api.post('/support/tickets', body) : await api.post('/contact', body);
      setDone({ ticketNo: res.data.ticketNo });
      setMsg(emptyMsg); setTk(emptyTicket);
    } catch (err) {
      if (err.status === 400 && err.details) setErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
      else setFail(err.status === 429 ? t('public.contact.tooMany') : t('public.contact.sendError'));
    } finally { setBusy(false); }
  };

  const switchTab = (next) => { setSp(next === 'ticket' ? { tab: 'ticket' } : {}, { replace: true }); setErrors({}); setFail(''); setDone(null); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('public.contact.title')}</h1>
      <p className="mt-2 text-muted">{t('public.contact.subtitle')}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          {cards.length > 0 && (
            <ul className="grid gap-3">
              {cards.map(({ key, icon: Icon, label, value, href, ext }) => (
                <li key={key}>
                  <a href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="flex min-h-16 items-center gap-4 rounded-card border border-line bg-surface p-4 transition hover:border-primary">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon size={22} /></span>
                    <span className="min-w-0"><span className="block text-sm text-muted">{label}</span><span className="block truncate font-semibold">{value}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {address && (
            <div className="flex items-start gap-4 rounded-card border border-line bg-surface p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><MapPin size={22} /></span>
              <div><p className="text-sm text-muted">{t('public.contact.address')}</p><p className="font-semibold">{address}</p>
                {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary">{t('public.contact.openMap')} <ExternalLink size={14} /></a>}
              </div>
            </div>
          )}
          {map && <iframe src={map} title={t('public.contact.address')} loading="lazy" referrerPolicy="no-referrer-when-downgrade" sandbox="allow-scripts allow-same-origin" className="h-72 w-full rounded-card border border-line" />}
          {cards.length === 0 && !address && <p className="rounded-card border border-dashed border-line p-6 text-center text-muted">{t('public.contact.useForm')}</p>}
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-control bg-surface-2 p-1" role="tablist">
            {['message', 'ticket'].map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => switchTab(k)} className={`min-h-11 rounded-control text-sm font-semibold ${tab === k ? 'bg-surface shadow' : 'text-muted'}`}>{t(`public.contact.tab_${k}`)}</button>
            ))}
          </div>

          {done ? (
            <div className="py-6 text-center" role="status">
              <CheckCircle2 className="mx-auto text-success" size={44} />
              <h2 className="mt-3 text-xl font-bold">{done.ticketNo ? t('public.contact.ticketSent') : t('public.contact.sent')}</h2>
              {done.ticketNo && <p className="mt-2">{t('public.contact.ticketNo')} <strong className="text-primary">{done.ticketNo}</strong></p>}
              <p className="mt-2 text-muted">{t('public.contact.sentText')}</p>
              <Button variant="outline" className="mt-5" onClick={() => setDone(null)}>{t('public.contact.another')}</Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              {tab === 'ticket' && <p className="text-sm text-muted">{t('public.contact.ticketHelp')}</p>}
              <Input label={`${t('public.contact.name')} *`} value={form.name} error={errors.name} onChange={set('name')} autoComplete="name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={`${t('public.contact.phone')}${tab === 'ticket' ? ' *' : ''}`} type="tel" inputMode="tel" value={form.phone} error={errors.phone} onChange={set('phone')} autoComplete="tel" />
                <Input label={t('public.contact.email')} type="email" inputMode="email" value={form.email} error={errors.email} onChange={set('email')} autoComplete="email" />
              </div>
              {tab === 'ticket' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ct-cat" className="mb-1.5 block text-sm font-medium">{t('public.contact.category')}</label>
                    <select id="ct-cat" value={tk.category} onChange={set('category')} className="min-h-12 w-full rounded-control border border-line bg-surface px-3">
                      {CATEGORIES.map((k) => <option key={k} value={k}>{t(`public.contact.cat_${k}`)}</option>)}
                    </select>
                  </div>
                  <Input label={t('public.contact.orderNo')} value={tk.orderNo} error={errors.orderNo} onChange={(e) => setTk({ ...tk, orderNo: e.target.value.toUpperCase() })} placeholder="SAJ-2026-000125" autoComplete="off" />
                </div>
              )}
              <Input label={`${t('public.contact.subject')} *`} value={form.subject} error={errors.subject} onChange={set('subject')} />
              <div>
                <label htmlFor="ct-msg" className="mb-1.5 block text-sm font-medium">{t('public.contact.message')} *</label>
                <textarea id="ct-msg" rows={5} maxLength={2000} value={form.message} onChange={set('message')} aria-invalid={!!errors.message} className={`${area} ${errors.message ? 'border-danger' : 'border-line'}`} />
                {errors.message && <p className="mt-1 text-sm text-danger">{errors.message}</p>}
              </div>
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}><label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label></div>
              {fail && <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm text-danger">{fail}</p>}
              <Button type="submit" disabled={busy} className="min-h-14 text-base">{busy && <Loader2 className="animate-spin" size={20} />} {busy ? t('public.contact.sending') : t('public.contact.send')}</Button>
              <p className="text-xs text-muted">{t('public.contact.privacy')}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
