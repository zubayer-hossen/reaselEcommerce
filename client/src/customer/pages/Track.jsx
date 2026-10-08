import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Loader2, Lock, MessageCircle, Phone, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useSeo } from '../../hooks/useSeo.js';
import { cld } from '../../utils/cloudinary.js';
import { formatDateTime, formatMoney, formatNumber, localized, safeUrl, toAsciiDigits } from '../../utils/format.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import TrackTimeline from '../../components/track/TrackTimeline.jsx';

const REFRESH_MS = 90 * 1000;
const TONE = { delivered: 'bg-success text-white', cancelled: 'bg-danger text-white', failed: 'bg-danger text-white', returned: 'bg-warning text-ink' };

// Reads the order the customer just placed (same browser tab), so "Track" from the success page needs no typing.
function lastOrderDigits(orderNo) {
  try {
    const o = JSON.parse(sessionStorage.getItem('order:last'));
    return o?.orderNo === orderNo ? String(o.customer?.phone || '').slice(-4) : '';
  } catch { return ''; }
}

export default function Track() {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  const [sp, setSp] = useSearchParams();
  const [orderNo, setOrderNo] = useState((sp.get('order') || '').toUpperCase());
  const [digits, setDigits] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null); // { text }
  const creds = useRef(null);
  useSeo({ title: `${t('public.track.title')} | ${siteName}`, description: t('public.track.subtitle') });

  const lookup = useCallback(async (no, d, { silent = false } = {}) => {
    if (!silent) { setBusy(true); setError(null); }
    try {
      const res = await api.post('/tracking/lookup', { orderNo: no, phoneLast4: d });
      creds.current = { no, d };
      setResult(res.data);
      setError(null);
    } catch (e) {
      if (silent) return; // a failed background refresh keeps the last good result on screen
      const code = e.details?.code;
      setResult(null);
      creds.current = null;
      setError(code === 'locked' ? t('public.track.locked') : e.status === 429 ? t('public.track.tooMany')
        : e.status === 404 ? t('public.track.noMatch') : e.status === 400 ? t('public.track.badInput') : t('public.track.networkError'));
    } finally {
      if (!silent) setBusy(false);
    }
  }, [t]);

  // arriving from the order-success page: fill the digits from this tab and look the order up straight away
  useEffect(() => {
    const no = (sp.get('order') || '').toUpperCase();
    const d = lastOrderDigits(no);
    if (no && d) { setDigits(d); lookup(no, d); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the page keeps itself up to date while it is open and visible
  useEffect(() => {
    if (!result) return undefined;
    const tick = () => { if (!document.hidden && creds.current) lookup(creds.current.no, creds.current.d, { silent: true }); };
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [result, lookup]);

  const submit = (e) => {
    e.preventDefault();
    const no = orderNo.trim().toUpperCase();
    const d = toAsciiDigits(digits.trim());
    if (!no || d.length !== 4) { setError(t('public.track.badInput')); return; }
    setSp({ order: no }, { replace: true });
    lookup(no, d);
  };

  const reset = () => { setResult(null); setDigits(''); setError(null); creds.current = null; };

  const c = settings?.contact || {};
  const wa = String(c.whatsapp || '').replace(/[^\d]/g, '');
  const messenger = safeUrl(c.messengerUrl);
  const hasSupport = c.phone || wa || messenger;

  if (!result) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary"><PackageSearch size={30} /></span>
          <h1 className="mt-4 font-display text-3xl font-bold">{t('public.track.title')}</h1>
          <p className="mt-2 text-muted">{t('public.track.subtitle')}</p>
        </div>
        <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
          <Input label={t('public.track.orderLabel')} value={orderNo} onChange={(e) => setOrderNo(e.target.value.toUpperCase())} placeholder="SAJ-2026-000125" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
          <Input label={t('public.track.phoneLabel')} value={digits} onChange={(e) => setDigits(e.target.value.slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="1234" autoComplete="off" hint={t('public.track.privacyNote')} />
          {error && <p role="alert" className="flex items-start gap-2 rounded-control bg-danger/10 px-3 py-2 text-sm text-danger">{error.includes?.(t('public.track.locked')) && <Lock size={16} className="mt-0.5 shrink-0" />}{error}</p>}
          <Button type="submit" disabled={busy} className="min-h-14 text-base">{busy && <Loader2 className="animate-spin" size={20} />} {busy ? t('public.track.searching') : t('public.track.submit')}</Button>
        </form>
        <p className="mt-4 flex items-start gap-2 text-sm text-muted"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" /> {t('public.track.idHelp')}</p>
      </div>
    );
  }

  const { order: o, events } = result;
  const ended = ['cancelled', 'failed', 'returned'].includes(o.orderStatus);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <section className="rounded-card border border-line bg-surface p-5">
        <p className="text-sm text-muted">{t('public.track.orderLabel')}</p>
        <p className="break-all text-2xl font-bold tracking-wide text-primary">{o.orderNo}</p>
        <span className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${TONE[o.orderStatus] || 'bg-primary text-primary-fg'}`}>{t(`public.track.status.${o.orderStatus}`)}</span>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">{t('public.track.placedOn')}</dt><dd className="font-medium">{formatDateTime(o.createdAt, lang)}</dd></div>
          {o.estimatedDelivery && !ended && o.orderStatus !== 'delivered' && (
            <div className="flex justify-between gap-3"><dt className="text-muted">{t('public.track.eta')}</dt><dd className="font-semibold text-primary">{new Date(o.estimatedDelivery).toLocaleDateString(lang === 'en' ? 'en-BD' : 'bn-BD', { dateStyle: 'long' })}</dd></div>
          )}
        </dl>
        {ended && <p className="mt-3 rounded-control bg-danger/10 px-3 py-2 text-sm text-danger">{t(`public.track.note_${o.orderStatus}`)}</p>}
      </section>

      <section className="mt-5 rounded-card border border-line bg-surface p-5">
        <h2 className="mb-5 font-semibold">{t('public.track.progress')}</h2>
        <TrackTimeline status={o.orderStatus} lastMain={o.lastMainStatus} events={events} />
        <p className="mt-5 flex items-center gap-2 text-xs text-muted"><RefreshCw size={12} /> {t('public.track.autoRefresh')}</p>
      </section>

      <section className="mt-5 rounded-card border border-line bg-surface p-5">
        <h2 className="mb-3 font-semibold">{t('public.track.items')}</h2>
        <ul className="divide-y divide-line">
          {o.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 py-2.5">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">{i.image && <img src={cld(i.image, { w: 120, h: 120, crop: 'fill' })} alt="" className="size-full object-cover" />}</span>
              <span className="min-w-0 flex-1"><span className="line-clamp-2 font-medium">{i.name}</span><span className="block text-sm text-muted">{[i.color, i.size].filter(Boolean).join(' · ')} × {formatNumber(i.qty, lang)}</span></span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t('public.cart.total')}</dt><dd className="font-bold text-primary">{formatMoney(o.total, lang)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">{t('public.checkout.payment')}</dt><dd className="text-end">{t(`public.checkout.methods.${o.paymentMethod}`)} · {t(`public.track.pay_${o.paymentStatus}`)}</dd></div>
        </dl>
      </section>

      {events.length > 0 && (
        <section className="mt-5 rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-semibold">{t('public.track.history')}</h2>
          <ul className="divide-y divide-line">
            {[...events].reverse().map((e, i) => (
              <li key={i} className="py-2.5"><p className="text-sm">{localized(e.message, lang)}</p><p className="text-xs text-muted">{formatDateTime(e.createdAt, lang)}</p></li>
            ))}
          </ul>
        </section>
      )}

      {hasSupport && (
        <section className="mt-5 rounded-card border border-line bg-surface p-5">
          <h2 className="font-semibold">{t('public.track.help')}</h2>
          <p className="mt-1 text-sm text-muted">{t('public.track.helpText')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {c.phone && <a href={`tel:${String(c.phone).replace(/[^\d+]/g, '')}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line font-medium"><Phone size={18} /> {c.phone}</a>}
            {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`${t('public.success.waMessage')} ${o.orderNo}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary font-medium text-primary-fg"><MessageCircle size={18} /> WhatsApp</a>}
            {messenger && <a href={messenger} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line font-medium"><MessageCircle size={18} /> Messenger</a>}
          </div>
        </section>
      )}

      <Button variant="outline" className="mt-6 w-full" onClick={reset}>{t('public.track.another')}</Button>
    </div>
  );
}
