import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Package, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { cld } from '../../utils/cloudinary.js';
import { formatMoney, formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';

const FILTERS = ['all', 'active', 'draft', 'low', 'out'];
const LIMIT = 20;

function stockBadge(p, t) {
  const total = p.totalStock;
  if (total <= 0) return { text: t('admin.products.outOfStock'), cls: 'bg-danger/15 text-danger' };
  if (total <= p.lowStockThreshold) return { text: t('admin.products.lowStock'), cls: 'bg-warning/20 text-warning' };
  return { text: t('admin.products.inStock'), cls: 'bg-success/15 text-success' };
}

export default function Products() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const toast = useToast();
  const canWrite = can('products:write');

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('');
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loadError, setLoadError] = useState(false);
  const [more, setMore] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    api.get('/admin/categories').then((r) => setCats(r.data.categories)).catch(() => {});
  }, []);

  const fetchPage = useCallback(async (page) => {
    const params = { page, limit: LIMIT };
    if (debouncedQ) params.q = debouncedQ;
    if (category) params.category = category;
    if (filter === 'active' || filter === 'draft') params.status = filter;
    if (filter === 'low' || filter === 'out') params.stock = filter;
    const res = await api.get('/admin/products', { params });
    return res.data;
  }, [debouncedQ, category, filter]);

  const reload = useCallback(async () => {
    setLoadError(false);
    setItems(null);
    try {
      const d = await fetchPage(1);
      setItems(d.products);
      setMeta({ page: d.page, pages: d.pages, total: d.total });
    } catch (e) {
      setLoadError(true);
      toast.error(e.message);
    }
  }, [fetchPage, toast]);

  useEffect(() => { reload(); }, [reload]);

  const loadMore = async () => {
    setMore(true);
    try {
      const d = await fetchPage(meta.page + 1);
      setItems((cur) => [...cur, ...d.products]);
      setMeta({ page: d.page, pages: d.pages, total: d.total });
    } catch (e) { toast.error(e.message); }
    finally { setMore(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/products/${toDelete._id}`);
      toast.success(t('admin.products.deleted'));
      setToDelete(null);
      reload();
    } catch (e) { toast.error(e.message); setToDelete(null); }
    finally { setBusy(false); }
  };

  const nameOf = (x) => (lang === 'en' && x.name?.en) || x.name?.bn;
  const filterLabel = { all: 'all', active: 'active', draft: 'draft', low: 'lowStock', out: 'outOfStock' };
  const statusLabel = { active: 'active', draft: 'draft', archived: 'archived' };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.products.search')} aria-label={t('admin.products.search')}
            className="min-h-12 w-full rounded-control border border-line bg-surface ps-10 pe-3"
          />
        </div>
        {canWrite && <Link to="/admin/products/new" className="inline-flex min-h-12 items-center gap-2 rounded-control bg-primary px-4 font-medium text-primary-fg"><Plus size={18} /> <span className="hidden sm:inline">{t('admin.products.add')}</span></Link>}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${filter === f ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>
            {t(`admin.products.${filterLabel[f]}`)}
          </button>
        ))}
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('admin.products.category')} className="min-h-11 shrink-0 rounded-full border border-line bg-surface px-3 text-sm">
          <option value="">{t('admin.products.allCategories')}</option>
          {cats.map((c) => <option key={c._id} value={c._id}>{nameOf(c)}</option>)}
        </select>
      </div>

      {loadError && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-danger">{t('admin.products.loadError')}</p>
          <Button variant="outline" className="mt-4" onClick={reload}>{t('admin.dashboard.retry')}</Button>
        </div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <Package className="mx-auto text-accent" size={32} />
          <p className="mt-3 font-semibold">{debouncedQ || filter !== 'all' || category ? t('admin.products.noResults') : t('admin.products.emptyTitle')}</p>
          {!debouncedQ && filter === 'all' && !category && <p className="mt-1 text-muted">{t('admin.products.emptyText')}</p>}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">{formatNumber(meta.total, lang)} {t('admin.products.countLabel')}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((p) => {
              const badge = stockBadge(p, t);
              const onSale = p.price < p.regularPrice;
              return (
                <li key={p._id} className="flex gap-3 rounded-card border border-line bg-surface p-3">
                  <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">
                    {p.images?.[0]?.url ? <img src={cld(p.images[0].url, { w: 200, h: 200, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover" /> : <Package className="text-muted" size={26} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{nameOf(p)}</p>
                    <p className="mt-0.5 text-sm">
                      <span className="font-semibold">{formatMoney(p.price, lang)}</span>
                      {onSale && <span className="ms-2 text-muted line-through">{formatMoney(p.regularPrice, lang)}</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${badge.cls}`}>{badge.text} · {formatNumber(p.totalStock, lang)}</span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-muted">{t(`admin.products.${statusLabel[p.status]}`)}</span>
                    </div>
                    {canWrite && (
                      <div className="mt-1 flex gap-1">
                        <Link to={`/admin/products/${p._id}`} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium hover:bg-surface-2"><Pencil size={16} /> {t('admin.products.edit')}</Link>
                        <button onClick={() => setToDelete(p)} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-danger hover:bg-surface-2"><Trash2 size={16} /> {t('admin.products.delete')}</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {meta.page < meta.pages && (
            <Button variant="outline" onClick={loadMore} disabled={more} className="self-center">
              {more && <Loader2 className="animate-spin" size={18} />} {t('admin.products.loadMore')}
            </Button>
          )}
        </>
      )}

      <BottomSheet open={!!toDelete} onClose={() => setToDelete(null)} closeLabel={t('admin.common.close')} title={t('admin.products.deleteTitle')}>
        <p className="text-muted">{t('admin.products.deleteText')} <strong className="text-ink">{toDelete && nameOf(toDelete)}</strong></p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setToDelete(null)}>{t('admin.admins.cancel')}</Button>
          <Button className="flex-1 !bg-danger !text-white" onClick={remove} disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.products.delete')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
