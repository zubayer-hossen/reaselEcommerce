import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Button from '../../components/ui/Button.jsx';

const split = (s) => [...new Set(s.split(/[,،\n]/).map((x) => x.trim()).filter(Boolean))];
const newKey = () => crypto.randomUUID();
const field = 'min-h-11 w-full rounded-control border border-line bg-surface px-3 text-base';

// variants = [{ _k, _id?, color, size, sku, price, stock, imageIdx }]  (imageIdx points into the gallery; -1 = none)
export default function VariantEditor({ variants, images, onChange }) {
  const { t } = useLanguage();
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');

  const generate = () => {
    const cs = split(colors);
    const ss = split(sizes);
    if (!cs.length && !ss.length) return;
    const have = new Set(variants.map((v) => `${v.color.toLowerCase()}|${v.size.toLowerCase()}`));
    const created = [];
    for (const c of cs.length ? cs : ['']) {
      for (const s of ss.length ? ss : ['']) {
        if (!have.has(`${c.toLowerCase()}|${s.toLowerCase()}`)) {
          created.push({ _k: newKey(), color: c, size: s, sku: '', price: '', stock: 0, imageIdx: -1 });
        }
      }
    }
    onChange([...variants, ...created]);
    setColors('');
    setSizes('');
  };

  const update = (k, patch) => onChange(variants.map((v) => (v._k === k ? { ...v, ...patch } : v)));
  const remove = (k) => onChange(variants.filter((v) => v._k !== k));
  const addOne = () => onChange([...variants, { _k: newKey(), color: '', size: '', sku: '', price: '', stock: 0, imageIdx: -1 }]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t('admin.products.variantsHint')}</p>

      <div className="rounded-control border border-dashed border-line p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="gen-colors" className="mb-1 block text-sm font-medium">{t('admin.products.colorsInput')}</label>
            <input id="gen-colors" value={colors} onChange={(e) => setColors(e.target.value)} placeholder={t('admin.products.colorsExample')} className={field} />
          </div>
          <div>
            <label htmlFor="gen-sizes" className="mb-1 block text-sm font-medium">{t('admin.products.sizesInput')}</label>
            <input id="gen-sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="52, 54, 56" className={field} />
          </div>
        </div>
        <Button type="button" variant="outline" onClick={generate} disabled={!colors.trim() && !sizes.trim()} className="mt-3 w-full md:w-auto">
          <Wand2 size={18} /> {t('admin.products.generate')}
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {variants.map((v) => (
          <li key={v._k} className="rounded-control border border-line bg-surface p-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`c-${v._k}`}>{t('admin.products.variantColor')}</label>
                <input id={`c-${v._k}`} value={v.color} onChange={(e) => update(v._k, { color: e.target.value })} className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`s-${v._k}`}>{t('admin.products.variantSize')}</label>
                <input id={`s-${v._k}`} value={v.size} onChange={(e) => update(v._k, { size: e.target.value })} className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`st-${v._k}`}>{t('admin.products.variantStock')}</label>
                <input id={`st-${v._k}`} type="number" inputMode="numeric" min="0" value={v.stock} onChange={(e) => update(v._k, { stock: e.target.value })} className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`p-${v._k}`}>{t('admin.products.variantPrice')}</label>
                <input id={`p-${v._k}`} type="number" inputMode="numeric" min="0" value={v.price} placeholder={t('admin.products.variantPriceHint')} onChange={(e) => update(v._k, { price: e.target.value })} className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`k-${v._k}`}>{t('admin.products.variantSku')}</label>
                <input id={`k-${v._k}`} value={v.sku} onChange={(e) => update(v._k, { sku: e.target.value })} className={field} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`i-${v._k}`}>{t('admin.products.variantImage')}</label>
                <select id={`i-${v._k}`} value={v.imageIdx} onChange={(e) => update(v._k, { imageIdx: Number(e.target.value) })} className={field}>
                  <option value={-1}>{t('admin.products.noImage')}</option>
                  {images.map((img, i) => <option key={img.publicId || img.url} value={i}>{`${t('admin.products.imageN')} ${i + 1}${img.label ? ` — ${img.label}` : ''}`}</option>)}
                </select>
              </div>
              <div className="flex items-end justify-end">
                <button type="button" onClick={() => remove(v._k)} aria-label={t('admin.products.removeVariant')} className="grid size-11 place-items-center rounded-control text-danger hover:bg-surface-2"><Trash2 size={20} /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" variant="outline" onClick={addOne}><Plus size={18} /> {t('admin.products.addVariant')}</Button>
    </div>
  );
}
