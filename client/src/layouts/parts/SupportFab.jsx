import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Phone, Bot, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import ChatPanel from '../../components/chat/ChatPanel.jsx';

// ONE floating button instead of three: tap it to choose Chat / WhatsApp / Call (only the ones that are set up).
// It sits above the bottom edge (clear of the sticky cart/buy bars and the back-to-top button), so nothing overlaps.
export default function SupportFab() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [menu, setMenu] = useState(false);
  const [chat, setChat] = useState(false);
  const wrap = useRef(null);

  const c = settings?.contact || {};
  const wa = String(c.whatsapp || '').replace(/[^\d]/g, '');
  const phone = String(c.phone || '').replace(/[^\d+]/g, '');
  const extras = [
    wa && { key: 'wa', icon: MessageCircle, label: t('public.chat.menuWhatsapp'), href: `https://wa.me/${wa}`, ext: true },
    phone && { key: 'call', icon: Phone, label: t('public.chat.menuCall'), href: `tel:${phone}` },
  ].filter(Boolean);

  useEffect(() => {
    if (!menu) return undefined;
    const away = (e) => { if (!wrap.current?.contains(e.target)) setMenu(false); };
    const esc = (e) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [menu]);

  const onFab = () => (extras.length ? setMenu((m) => !m) : setChat(true));
  const item = 'flex min-h-12 items-center gap-3 rounded-full border border-line bg-surface ps-4 pe-5 font-medium shadow-soft';

  return (
    <>
      {!chat && (
        <div ref={wrap} className="fixed end-4 z-[45] flex flex-col items-end gap-3" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 7.5rem)' }}>
          <AnimatePresence>
            {menu && (
              <motion.ul initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex flex-col items-end gap-2">
                {extras.map(({ key, icon: Icon, label, href, ext }) => (
                  <li key={key}><a href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={item}><Icon size={20} className="text-accent" /> {label}</a></li>
                ))}
                <li><button onClick={() => { setMenu(false); setChat(true); }} className={item}><Bot size={20} className="text-accent" /> {t('public.chat.menuChat')}</button></li>
              </motion.ul>
            )}
          </AnimatePresence>
          <button onClick={onFab} aria-label={t('public.chat.open')} aria-expanded={extras.length ? menu : undefined} className="grid size-14 place-items-center rounded-full bg-primary text-primary-fg shadow-soft transition active:scale-95">
            {menu ? <X size={24} /> : <MessageCircle size={26} />}
          </button>
        </div>
      )}
      <ChatPanel open={chat} onClose={() => setChat(false)} />
    </>
  );
}
