import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Phone, Loader2, ShieldQuestion } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { ORDER_GROUPS } from '../../constants/orderStatus.js';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import { OrderStatusBadge, PayStatusBadge } from '../components/StatusBadge.jsx';

const TABS = ['all', 'pending', 'processing', 'delivered', 'cancelled', 'returns', 'paymentCheck'];
const RANGES = ['anytime', 'today', 'days7', 'days30'];
const RANGE_PARAM = { today: 'today', days7: '7d', days30: '30d' };
const LIMIT = 20;

export default function Orders() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(TABS.includes(sp.get('tab')) ? sp.get('tab') : 'all');
  const [range, setRange] = useState('anytime');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDq(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const fetchPage = useCallback(async (page) => {
    const params = { page, limit: LIMIT };
    if (dq) params.q = dq;
    if (tab === 'paymentCheck') params.paymentStatus = 'submitted';
    else if (ORDER_GROUPS[tab]?.length) params.status = ORDER_GROUPS[tab].join(',');
    if (RANGE_PARAM[range]) params.range = RANGE_PARAM[range];
    return (await api.get('/admin/orders', { params })).data;
  }, [dq, tab, range]);

  const reload = useCallback(async () => {
    setError(false);
    setItems(null);
    try {
      const d = await fetchPage(1);
      setItems(d.orders);
      setCounts(d.counts);
      setMeta({ page: d.page, pages: d.pages, total: d.total });
    } catch (e) { setError(true); toast.error(e.message); }
  }, [fetchPage, toast]);

  useEffect(() => { reload(); }, [reload]);

  const loadMore = async () => {
    setMore(true);
    try {
      const d = await fetchPage(meta.page + 1);
      setItems((cur) => [...cur, ...d.orders]);
      setMeta({ page: d.page, pages: d.pages, total: d.total });
    } catch (e) { toast.error(e.message); } finally { setMore(false); }
  };

  const tabCount = (k) => {
    if (k === 'all') return counts.all;
    if (k === 'paymentCheck') return counts.paymentCheck;
    return ORDER_GROUPS[k].reduce((s, st) => s + (counts[st] || 0), 0);
  };

  const summary = (o) => {
    const first = o.items?.[0];
    if (!first) return '';
    return `${first.name} ×${formatNumber(first.qty, lang)}${o.items.length > 1 ? ` ${t('admin.orders.andMore').replace('{n}', formatNumber(o.items.length - 1, lang))}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.orders.search')} aria-label={t('admin.orders.search')}
          className="min-h-12 w-full rounded-control border border-line bg-surface ps-10 pe-3" />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((k) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium ${tab === k ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>
            {k === 'paymentCheck' && <ShieldQuestion size={16} />}
            {t(`admin.orders.tab.${k}`)}
            {tabCount(k) > 0 && <span className={`rounded-full px-1.5 text-xs ${tab === k ? 'bg-white/25' : 'bg-surface-2'}`}>{formatNumber(tabCount(k), lang)}</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{items ? `${formatNumber(meta.total, lang)} ${t('admin.orders.countLabel')}` : ''}</p>
        <select value={range} onChange={(e) => setRange(e.target.value)} aria-label={t('admin.orders.range')} className="min-h-11 rounded-control border border-line bg-surface px-3 text-sm">
          {RANGES.map((r) => <option key={r} value={r}>{t(`admin.orders.range_${r}`)}</option>)}
        </select>
      </div>

      {error && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-danger">{t('admin.orders.loadError')}</p>
          <Button variant="outline" className="mt-4" onClick={reload}>{t('admin.dashboard.retry')}</Button>
        </div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <ShoppingBag className="mx-auto text-accent" size={32} />
          <p className="mt-3 font-semibold">{dq || tab !== 'all' || range !== 'anytime' ? t('admin.orders.noResults') : t('admin.orders.emptyTitle')}</p>
          {!dq && tab === 'all' && range === 'anytime' && <p className="mt-1 text-muted">{t('admin.orders.emptyText')}</p>}
        </div>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((o) => (
              <li key={o._id} className="rounded-card border border-line bg-surface">
                <Link to={`/admin/orders/${o._id}`} className="block p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold tracking-wide text-primary">{o.orderNo}</p>
                    <OrderStatusBadge status={o.orderStatus} />
                  </div>
                  <p className="mt-2 font-semibold">{o.customer.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted">{summary(o)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{formatMoney(o.total, lang)}</span>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">{t(`public.checkout.methods.${o.paymentMethod}`)}</span>
                    <PayStatusBadge status={o.paymentStatus} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{formatDateTime(o.createdAt, lang)}</p>
                </Link>
                <a href={`tel:${o.customer.phone}`} className="flex min-h-12 items-center gap-2 border-t border-line px-4 text-sm font-medium text-primary">
                  <Phone size={16} /> {o.customer.phone}
                </a>
              </li>
            ))}
          </ul>
          {meta.page < meta.pages && (
            <Button variant="outline" onClick={loadMore} disabled={more} className="self-center">
              {more && <Loader2 className="animate-spin" size={18} />} {t('admin.products.loadMore')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
