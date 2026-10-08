import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatNumber, localized } from '../../utils/format.js';

const chip = (on) => `min-h-11 rounded-full border px-4 text-sm font-medium transition ${on ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface hover:bg-surface-2'}`;
const numericSort = (a, b) => a.localeCompare(b, undefined, { numeric: true });

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-line pb-5 last:border-0">
      <legend className="mb-3 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

// Controlled. `value` holds the active filters (strings), `onChange(patch)` receives only what changed.
// instant=true (desktop sidebar): price commits after a short pause. instant=false (bottom sheet): commits on every change.
export default function FilterPanel({ options, cats, value, onChange, instant = false }) {
  const { t, lang } = useLanguage();
  const [price, setPrice] = useState({ min: value.minPrice, max: value.maxPrice });
  const timer = useRef(null);

  // keep local price text in sync when filters are cleared elsewhere
  useEffect(() => { setPrice({ min: value.minPrice, max: value.maxPrice }); }, [value.minPrice, value.maxPrice]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const setPriceField = (field, v) => {
    const next = { ...price, [field]: v.replace(/\D/g, '') };
    setPrice(next);
    const commit = () => onChange({ minPrice: next.min, maxPrice: next.max });
    if (!instant) return commit();
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, 600);
    return undefined;
  };

  const toggle = (key) => onChange({ [key]: value[key] === 'true' ? '' : 'true' });
  const pick = (key, v) => onChange({ [key]: value[key] === v ? '' : v });
  const topCats = (cats || []).filter((c) => !c.parent);
  const childrenOf = (id) => (cats || []).filter((c) => c.parent === id);
  const sizes = [...(options?.sizes || [])].sort(numericSort);

  return (
    <div className="flex flex-col gap-5">
      {topCats.length > 0 && (
        <Group title={t('public.shop.category')}>
          <div className="flex flex-col">
            <button type="button" onClick={() => onChange({ category: '' })} aria-pressed={!value.category} className={`flex min-h-11 items-center rounded-control px-2 text-start ${!value.category ? 'font-semibold text-primary' : ''}`}>{t('public.shop.allCategories')}</button>
            {topCats.map((c) => (
              <div key={c._id}>
                <button type="button" onClick={() => onChange({ category: c.slug })} aria-pressed={value.category === c.slug} className={`flex min-h-11 w-full items-center rounded-control px-2 text-start ${value.category === c.slug ? 'font-semibold text-primary' : ''}`}>{localized(c.name, lang)}</button>
                {childrenOf(c._id).map((sub) => (
                  <button key={sub._id} type="button" onClick={() => onChange({ category: sub.slug })} aria-pressed={value.category === sub.slug} className={`flex min-h-11 w-full items-center rounded-control ps-7 pe-2 text-start text-sm ${value.category === sub.slug ? 'font-semibold text-primary' : 'text-muted'}`}>{localized(sub.name, lang)}</button>
                ))}
              </div>
            ))}
          </div>
        </Group>
      )}

      <Group title={t('public.shop.price')}>
        <div className="flex items-center gap-2">
          <input inputMode="numeric" aria-label={t('public.shop.min')} placeholder={options?.price?.max ? `${t('public.shop.min')} (${formatNumber(options.price.min, lang)})` : t('public.shop.min')} value={price.min} onChange={(e) => setPriceField('min', e.target.value)} className="min-h-11 w-full min-w-0 rounded-control border border-line bg-surface px-3" />
          <span aria-hidden="true">–</span>
          <input inputMode="numeric" aria-label={t('public.shop.max')} placeholder={options?.price?.max ? `${t('public.shop.max')} (${formatNumber(options.price.max, lang)})` : t('public.shop.max')} value={price.max} onChange={(e) => setPriceField('max', e.target.value)} className="min-h-11 w-full min-w-0 rounded-control border border-line bg-surface px-3" />
        </div>
      </Group>

      {sizes.length > 0 && (
        <Group title={t('public.shop.size')}>
          <div className="flex flex-wrap gap-2">{sizes.map((s) => <button key={s} type="button" aria-pressed={value.size === s} onClick={() => pick('size', s)} className={chip(value.size === s)}>{s}</button>)}</div>
        </Group>
      )}

      {(options?.colors || []).length > 0 && (
        <Group title={t('public.shop.color')}>
          <div className="flex flex-wrap gap-2">{options.colors.map((c) => <button key={c} type="button" aria-pressed={value.color === c} onClick={() => pick('color', c)} className={chip(value.color === c)}>{c}</button>)}</div>
        </Group>
      )}

      {(options?.brands || []).length > 0 && (
        <Group title={t('public.shop.brand')}>
          <div className="flex flex-wrap gap-2">{options.brands.map((b) => <button key={b} type="button" aria-pressed={value.brand === b} onClick={() => pick('brand', b)} className={chip(value.brand === b)}>{b}</button>)}</div>
        </Group>
      )}

      <Group title={t('public.shop.rating')}>
        <div className="flex gap-2">
          {['4', '3'].map((r) => <button key={r} type="button" aria-pressed={value.minRating === r} onClick={() => pick('minRating', r)} className={chip(value.minRating === r)}>{formatNumber(r, lang)}+ ★</button>)}
        </div>
      </Group>

      <Group title={t('public.shop.availability')}>
        {[['inStock', 'inStock'], ['featured', 'featured'], ['isNew', 'new'], ['bestSeller', 'best']].map(([key, label]) => (
          <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" checked={value[key] === 'true'} onChange={() => toggle(key)} className="size-5 accent-[rgb(var(--primary))]" />
            {t(`public.shop.${label}`)}
          </label>
        ))}
      </Group>
    </div>
  );
}
