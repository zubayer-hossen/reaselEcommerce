import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useSeo } from '../../hooks/useSeo.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { formatNumber, localized } from '../../utils/format.js';
import ProductCard from '../../components/ProductCard.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import Button from '../../components/ui/Button.jsx';
import FilterPanel from '../../components/shop/FilterPanel.jsx';
import AdSlot from '../../components/AdSlot.jsx';

const KEYS = ['q', 'category', 'brand', 'size', 'color', 'minPrice', 'maxPrice', 'minRating', 'inStock', 'featured', 'isNew', 'bestSeller'];
const FILTER_KEYS = KEYS.filter((k) => k !== 'q');
const SORTS = [['newest', 'sortNewest'], ['price_asc', 'sortPriceAsc'], ['price_desc', 'sortPriceDesc'], ['popular', 'sortPopular'], ['rating', 'sortRating']];
const LIMIT = 12;

export default function Shop() {
  const { t, lang } = useLanguage();
  const { siteName } = useSettings();
  const [sp, setSp] = useSearchParams();
  const [sheet, setSheet] = useState(false);

  const value = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, sp.get(k) || ''])), [sp]);
  const sort = SORTS.some(([k]) => k === sp.get('sort')) ? sp.get('sort') : 'newest';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const [draft, setDraft] = useState(value);

  // All state lives in the URL: shareable links, working back button.
  const update = useCallback((patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v == null) next.delete(k); else next.set(k, String(v)); });
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  }, [sp, setSp]);

  const params = useMemo(
    () => ({ ...Object.fromEntries(Object.entries(value).filter(([, v]) => v)), sort, page, limit: LIMIT }),
    [value, sort, page]
  );

  const { data, loading, error, reload } = useApi(() => api.get('/products', { params }), [JSON.stringify(params)]);
  const options = useApi(() => api.get('/products/filters'), []).data;
  const cats = useApi(() => api.get('/categories'), []).data?.categories || [];

  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);

  const activeCat = cats.find((c) => c.slug === value.category);
  const heading = value.q ? `“${value.q}”` : activeCat ? localized(activeCat.name, lang) : t('nav.products');
  useSeo({ title: `${heading} | ${siteName}`, description: t('public.shop.seoDescription') });

  // ----- active filter chips -----
  const chips = [];
  if (value.category) chips.push({ id: 'category', label: activeCat ? localized(activeCat.name, lang) : value.category, clear: { category: '' } });
  if (value.brand) chips.push({ id: 'brand', label: value.brand, clear: { brand: '' } });
  if (value.size) chips.push({ id: 'size', label: `${t('public.shop.size')}: ${value.size}`, clear: { size: '' } });
  if (value.color) chips.push({ id: 'color', label: value.color, clear: { color: '' } });
  if (value.minPrice || value.maxPrice) chips.push({ id: 'price', label: `৳${formatNumber(value.minPrice || 0, lang)} – ${value.maxPrice ? `৳${formatNumber(value.maxPrice, lang)}` : '∞'}`, clear: { minPrice: '', maxPrice: '' } });
  if (value.minRating) chips.push({ id: 'minRating', label: `${formatNumber(value.minRating, lang)}+ ★`, clear: { minRating: '' } });
  [['inStock', 'inStock'], ['featured', 'featured'], ['isNew', 'new'], ['bestSeller', 'best']].forEach(([k, label]) => {
    if (value[k] === 'true') chips.push({ id: k, label: t(`public.shop.${label}`), clear: { [k]: '' } });
  });
  const clearAll = Object.fromEntries(FILTER_KEYS.map((k) => [k, '']));

  const openSheet = () => { setDraft(value); setSheet(true); };
  const applySheet = () => { update(Object.fromEntries(FILTER_KEYS.map((k) => [k, draft[k]]))); setSheet(false); };

  const products = data?.products || [];
  const pages = data?.pages || 1;
  const go = (n) => update({ page: n > 1 ? n : '' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <AdSlot placement="shop_banner" className="-mx-4 mb-8 max-w-none px-0" />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{heading}</h1>
          {data && <p className="mt-1 text-muted">{formatNumber(data.total, lang)} {t('public.shop.countLabel')}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openSheet} className="flex min-h-11 items-center gap-2 rounded-control border border-line bg-surface px-4 font-medium lg:hidden">
            <SlidersHorizontal size={18} /> {t('public.shop.filters')}{chips.length > 0 && ` (${formatNumber(chips.length, lang)})`}
          </button>
          <label className="sr-only" htmlFor="sort">{t('public.shop.sort')}</label>
          <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })} className="min-h-11 rounded-control border border-line bg-surface px-3">
            {SORTS.map(([k, label]) => <option key={k} value={k}>{t(`public.shop.${label}`)}</option>)}
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.id} onClick={() => update(c.clear)} className="flex min-h-10 items-center gap-1.5 rounded-full bg-surface-2 ps-3 pe-2 text-sm font-medium" aria-label={`${t('public.shop.remove')} ${c.label}`}>
              {c.label} <X size={16} />
            </button>
          ))}
          <button onClick={() => update(clearAll)} className="min-h-10 px-2 text-sm font-medium text-primary">{t('public.shop.clearAll')}</button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside className="hidden lg:block" aria-label={t('public.shop.filters')}>
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pe-2">
            <FilterPanel instant options={options} cats={cats} value={value} onChange={update} />
          </div>
        </aside>

        <div>
          {error ? (
            <div className="rounded-card border border-line p-10 text-center">
              <p className="text-muted">{t('public.states.loadError')}</p>
              <Button variant="outline" className="mt-4" onClick={reload}>{t('public.states.retry')}</Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-card bg-surface-2" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-12 text-center">
              <SearchX className="mx-auto text-accent" size={36} />
              <p className="mt-3 font-semibold">{t('public.shop.emptyTitle')}</p>
              <p className="mt-1 text-muted">{t('public.shop.emptyText')}</p>
              {(chips.length > 0 || value.q) && <Button variant="outline" className="mt-5" onClick={() => update({ ...clearAll, q: '' })}>{t('public.shop.clearAll')}</Button>}
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3">
                {products.map((p) => <li key={p._id}><ProductCard product={p} /></li>)}
              </ul>
              {pages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-3" aria-label={t('public.shop.page')}>
                  <button onClick={() => go(page - 1)} disabled={page <= 1} aria-label={t('public.shop.prev')} className="grid size-12 place-items-center rounded-control border border-line disabled:opacity-40"><ChevronLeft size={20} /></button>
                  <span className="min-w-28 text-center font-medium">{formatNumber(page, lang)} / {formatNumber(pages, lang)}</span>
                  <button onClick={() => go(page + 1)} disabled={page >= pages} aria-label={t('public.shop.next')} className="grid size-12 place-items-center rounded-control border border-line disabled:opacity-40"><ChevronRight size={20} /></button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters: edit a draft, apply once */}
      <BottomSheet open={sheet} onClose={() => setSheet(false)} closeLabel={t('public.close')} title={t('public.shop.filters')}>
        <FilterPanel options={options} cats={cats} value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
        <div className="sticky bottom-0 -mx-5 mt-4 flex gap-3 border-t border-line bg-surface px-5 pt-3">
          <Button variant="outline" className="flex-1" onClick={() => setDraft({ ...draft, ...clearAll })}>{t('public.shop.reset')}</Button>
          <Button className="flex-[2]" onClick={applySheet}>{t('public.shop.apply')}</Button>
        </div>
      </BottomSheet>
    </div>
  );
}
