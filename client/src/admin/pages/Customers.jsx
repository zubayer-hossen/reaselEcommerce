import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Phone, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';

const SORTS = ['recent', 'spent', 'orders'];
const LIMIT = 20;

export default function Customers() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [sort, setSort] = useState('recent');
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, summary: null });
  const [error, setError] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => { const id = setTimeout(() => setDq(q.trim()), 350); return () => clearTimeout(id); }, [q]);

  const fetchPage = useCallback(async (page) => (await api.get('/admin/customers', { params: { page, limit: LIMIT, sort, ...(dq ? { q: dq } : {}) } })).data, [dq, sort]);

  const reload = useCallback(async () => {
    setError(false);
    setItems(null);
    try {
      const d = await fetchPage(1);
      setItems(d.customers);
      setMeta({ page: d.page, pages: d.pages, total: d.total, summary: d.summary });
    } catch (e) { setError(true); toast.error(e.message); }
  }, [fetchPage, toast]);
  useEffect(() => { reload(); }, [reload]);

  const loadMore = async () => {
    setMore(true);
    try {
      const d = await fetchPage(meta.page + 1);
      setItems((cur) => [...cur, ...d.customers]);
      setMeta((m) => ({ ...m, page: d.page, pages: d.pages }));
    } catch (e) { toast.error(e.message); } finally { setMore(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      {meta.summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-surface p-4"><p className="text-2xl font-bold">{formatNumber(meta.summary.all, lang)}</p><p className="text-sm text-muted">{t('admin.customers.total')}</p></div>
          <div className="rounded-card border border-line bg-surface p-4"><p className="text-2xl font-bold">{formatNumber(meta.summary.repeat, lang)}</p><p className="text-sm text-muted">{t('admin.customers.repeat')}</p></div>
        </div>
      )}

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.customers.search')} aria-label={t('admin.customers.search')} className="min-h-12 w-full rounded-control border border-line bg-surface ps-10 pe-3" />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {SORTS.map((s) => (
          <button key={s} onClick={() => setSort(s)} aria-pressed={sort === s} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${sort === s ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>{t(`admin.customers.sort_${s}`)}</button>
        ))}
      </div>

      {error && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center"><p className="text-danger">{t('admin.customers.loadError')}</p><Button variant="outline" className="mt-4" onClick={reload}>{t('admin.dashboard.retry')}</Button></div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <Users className="mx-auto text-accent" size={32} />
          <p className="mt-3 font-semibold">{dq ? t('admin.customers.noResults') : t('admin.customers.emptyTitle')}</p>
          {!dq && <p className="mt-1 text-muted">{t('admin.customers.emptyText')}</p>}
        </div>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((c) => (
              <li key={c._id} className="rounded-card border border-line bg-surface">
                <Link to={`/admin/customers/${c._id}`} className="block p-4 pb-3">
                  <p className="font-semibold">{c.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span><strong>{formatNumber(c.orderCount, lang)}</strong> {t('admin.customers.ordersWord')}</span>
                    <span className="font-semibold text-primary">{formatMoney(c.totalSpent, lang)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{t('admin.customers.lastOrder')}: {c.lastOrderAt ? formatDateTime(c.lastOrderAt, lang) : t('admin.customers.never')}</p>
                </Link>
                <a href={`tel:${c.phone}`} className="flex min-h-12 items-center gap-2 border-t border-line px-4 text-sm font-medium text-primary"><Phone size={16} /> {c.phone}</a>
              </li>
            ))}
          </ul>
          {meta.page < meta.pages && <Button variant="outline" onClick={loadMore} disabled={more} className="self-center">{more && <Loader2 className="animate-spin" size={18} />} {t('admin.products.loadMore')}</Button>}
        </>
      )}
    </div>
  );
}
