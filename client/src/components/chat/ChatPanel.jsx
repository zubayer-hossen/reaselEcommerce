import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, Send, X, Package, ExternalLink } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { cld } from '../../utils/cloudinary.js';
import { formatMoney, localized, safeUrl } from '../../utils/format.js';

const KEY = 'chat:v1';
const MAX_KEPT = 30;
const ACT_KEY = { call: 'call', whatsapp: 'whatsapp', messenger: 'messenger', ticket: 'ticket', track: 'track', faq: 'faq', contactPage: 'contactPage', viewProduct: 'viewProduct', shop: 'shop' };

const load = () => { try { const v = JSON.parse(sessionStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };

// Buttons under a bot reply: internal pages open in-app; tel:/WhatsApp/Messenger open outside.
function Actions({ actions, onNavigate }) {
  const { t } = useLanguage();
  if (!actions?.length) return null;
  const cls = 'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/40 bg-surface px-3.5 text-sm font-medium text-primary hover:bg-primary/5';
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((a) => {
        const label = t(`public.chat.act.${ACT_KEY[a.key] || 'contactPage'}`);
        if (a.href.startsWith('/')) return <Link key={a.key} to={a.href} onClick={onNavigate} className={cls}>{label}</Link>;
        if (a.href.startsWith('tel:')) return <a key={a.key} href={a.href} className={cls}>{label}</a>;
        const href = safeUrl(a.href);
        return href ? <a key={a.key} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label} <ExternalLink size={13} /></a> : null;
      })}
    </div>
  );
}

function Products({ products, onNavigate }) {
  const { t, lang } = useLanguage();
  if (!products?.length) return null;
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {products.map((p) => (
        <li key={p.slug}>
          <Link to={`/product/${p.slug}`} onClick={onNavigate} className="flex items-center gap-3 rounded-control border border-line bg-surface p-2 hover:border-primary">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">
              {p.image ? <img src={cld(p.image, { w: 120, h: 120, crop: 'fill' })} alt="" className="size-full object-cover" /> : <Package size={20} className="text-muted" />}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-1 font-medium">{localized(p.name, lang)}</span>
              <span className="block text-sm"><strong className="text-primary">{formatMoney(p.price, lang)}</strong>{p.stockStatus === 'out_of_stock' && <span className="ms-2 text-danger">{t('public.card.out')}</span>}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ChatPanel({ open, onClose }) {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  const [messages, setMessages] = useState(load);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_KEPT))); } catch { /* ignore */ } }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, busy, open]);
  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(id); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const offlineActions = () => {
    const c = settings?.contact || {};
    const out = [];
    if (c.phone) out.push({ key: 'call', href: `tel:${String(c.phone).replace(/[^\d+]/g, '')}` });
    if (c.whatsapp) out.push({ key: 'whatsapp', href: `https://wa.me/${String(c.whatsapp).replace(/[^\d]/g, '')}` });
    out.push({ key: 'ticket', href: '/contact?tab=ticket' });
    return out;
  };

  const send = async (raw) => {
    const msg = raw.trim();
    if (!msg || busy) return;
    setText('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'user', text: msg }]);
    setBusy(true);
    try {
      const res = await api.post('/chatbot/message', { message: msg, lang });
      const r = res.data.reply;
      setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'bot', text: r.text, products: r.products, actions: r.actions }]);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'bot', text: e.status === 429 ? t('public.chat.slowDown') : t('public.chat.offline'), actions: offlineActions() }]);
    } finally { setBusy(false); }
  };

  if (!open) return null;
  const quick = [1, 2, 3, 4].map((i) => t(`public.chat.quick.q${i}`));

  return (
    <div className="fixed inset-0 z-[56]">
      <div className="absolute inset-0 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />
      <motion.section
        role="dialog" aria-modal="false" aria-label={t('public.chat.title')}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}
        className="absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col overflow-hidden rounded-t-card border border-line bg-bg shadow-soft md:inset-x-auto md:bottom-5 md:end-5 md:h-[34rem] md:w-96 md:rounded-card"
      >
        <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-fg">
          <span className="grid size-10 place-items-center rounded-full bg-white/20"><Bot size={22} /></span>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{siteName}</p><p className="text-xs opacity-80">{t('public.chat.title')} · {t('public.chat.subtitle')}</p></div>
          <button onClick={onClose} aria-label={t('public.close')} className="grid size-10 place-items-center rounded-full hover:bg-white/15"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-4" role="log" aria-live="polite">
          <div className="max-w-[88%] rounded-2xl rounded-ss-sm bg-surface px-4 py-3 shadow-sm"><p className="whitespace-pre-line">{t('public.chat.welcome')}</p></div>

          {messages.length === 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map((q) => <button key={q} onClick={() => send(q)} className="min-h-10 rounded-full border border-line bg-surface px-3.5 text-sm hover:border-primary">{q}</button>)}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`mt-3 flex ${m.from === 'user' ? 'justify-end' : ''}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${m.from === 'user' ? 'rounded-ee-sm bg-primary text-primary-fg' : 'rounded-ss-sm bg-surface shadow-sm'}`}>
                <p className="whitespace-pre-line break-words">{m.text}</p>
                {m.from === 'bot' && <><Products products={m.products} onNavigate={onClose} /><Actions actions={m.actions} onNavigate={onClose} /></>}
              </div>
            </div>
          ))}

          {busy && (
            <div className="mt-3 flex" aria-label={t('public.chat.typing')}>
              <div className="flex items-center gap-1 rounded-2xl rounded-ss-sm bg-surface px-4 py-3 shadow-sm">
                {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 120}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="border-t border-line bg-surface p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          <div className="flex gap-2">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={t('public.chat.placeholder')} aria-label={t('public.chat.placeholder')} className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base" />
            <button type="submit" disabled={busy || !text.trim()} aria-label={t('public.chat.send')} className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-fg disabled:opacity-40"><Send size={20} /></button>
          </div>
          <p className="mt-2 text-center text-[11px] leading-snug text-muted">{t('public.chat.privacy')}</p>
        </form>
      </motion.section>
    </div>
  );
}
