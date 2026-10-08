import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime, formatNumber, localized } from '../../utils/format.js';
import BottomSheet from '../../components/ui/BottomSheet.jsx';

const ICON = { new_order: ShoppingBag, payment_submitted: CreditCard, low_stock: AlertTriangle, out_of_stock: AlertTriangle };
const POLL_MS = 60 * 1000;

export default function NotificationBell() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  // unread counter: refresh every minute while the tab is visible
  const refreshCount = useCallback(() => {
    if (document.hidden) return;
    api.get('/admin/notifications', { params: { limit: 1 } }).then((r) => setCount(r.data.unreadCount)).catch(() => {});
  }, []);
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    document.addEventListener('visibilitychange', refreshCount);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', refreshCount); };
  }, [refreshCount]);

  const load = useCallback(async () => {
    setError(false);
    try {
      const r = await api.get('/admin/notifications', { params: { limit: 30 } });
      setItems(r.data.notifications);
      setCount(r.data.unreadCount);
    } catch { setError(true); }
  }, []);

  const openPanel = () => { setOpen(true); setItems(null); load(); };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      setCount((c) => Math.max(0, c - 1));
      api.post('/admin/notifications/read', { ids: [n._id] }).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try { await api.post('/admin/notifications/read', { all: true }); await load(); } catch { /* keep the list */ }
  };

  return (
    <>
      <button onClick={openPanel} aria-label={`${t('admin.notifications.title')}${count ? ` (${count})` : ''}`} className="relative grid size-11 place-items-center rounded-control hover:bg-surface-2">
        <Bell size={20} />
        {count > 0 && <span className="absolute end-1 top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-5 text-white">{count > 99 ? '99+' : formatNumber(count, lang)}</span>}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={t('admin.notifications.title')} closeLabel={t('admin.common.close')}>
        {error ? (
          <p className="py-6 text-center text-danger">{t('admin.notifications.loadError')}</p>
        ) : !items ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted" /></div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-muted">{t('admin.notifications.empty')}</p>
        ) : (
          <>
            {count > 0 && <button onClick={markAll} className="mb-2 min-h-11 text-sm font-medium text-primary">{t('admin.notifications.markAll')}</button>}
            <ul className="divide-y divide-line">
              {items.map((n) => {
                const Icon = ICON[n.type] || Bell;
                return (
                  <li key={n._id}>
                    <button onClick={() => openItem(n)} className={`flex w-full items-start gap-3 rounded-control px-1 py-3 text-start ${n.read ? '' : 'bg-primary/5'}`}>
                      <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${n.type.includes('stock') ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'}`}><Icon size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">{localized(n.title, lang)}{!n.read && <span className="size-2 rounded-full bg-danger" aria-label={t('admin.notifications.unread')} />}</span>
                        <span className="block break-words text-sm text-muted">{localized(n.body, lang)}</span>
                        <span className="mt-0.5 block text-xs text-muted">{formatDateTime(n.createdAt, lang)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </BottomSheet>
    </>
  );
}
