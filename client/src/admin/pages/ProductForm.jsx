import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import GalleryEditor from '../components/GalleryEditor.jsx';
import VariantEditor from '../components/VariantEditor.jsx';

const empty = {
  nameBn: '', nameEn: '', slug: '', category: '', subcategory: '', brand: '', sku: '', shortBn: '', descBn: '',
  regularPrice: '', salePrice: '', stock: 0, lowStockThreshold: 5,
  images: [], variants: [], videoUrl: '',
  materials: '', features: '', tags: '', specs: [],
  isFeatured: false, isNewArrival: false, isBestSeller: false,
  status: 'draft', seoTitle: '', seoDescription: '',
};

const splitList = (s) => s.split(/[,،\n]/).map((x) => x.trim()).filter(Boolean);
const pickImage = ({ url, publicId, alt, label }) => ({ url, publicId, alt: alt || undefined, label: label || undefined });

function toForm(p) {
  const images = p.images || [];
  return {
    nameBn: p.name?.bn || '', nameEn: p.name?.en || '', slug: p.slug || '', category: p.category?._id || p.category || '',
    subcategory: p.subcategory || '', brand: p.brand || '', sku: p.sku || '',
    shortBn: p.shortDescription?.bn || '', descBn: p.description?.bn || '',
    regularPrice: p.regularPrice ?? '', salePrice: p.salePrice ?? '', stock: p.stock ?? 0, lowStockThreshold: p.lowStockThreshold ?? 5,
    images,
    variants: (p.variants || []).map((v) => ({
      _k: v._id, _id: v._id, color: v.color || '', size: v.size || '', sku: v.sku || '',
      price: v.price ?? '', stock: v.stock ?? 0,
      imageIdx: v.image?.url ? images.findIndex((i) => i.url === v.image.url) : -1,
    })),
    videoUrl: p.videos?.[0]?.url || '',
    materials: (p.materials || []).join(', '), features: (p.features || []).join('\n'), tags: (p.tags || []).join(', '),
    specs: (p.specs || []).map((s) => ({ key: s.key, value: s.value })),
    isFeatured: !!p.isFeatured, isNewArrival: !!p.isNewArrival, isBestSeller: !!p.isBestSeller,
    status: p.status || 'draft', seoTitle: p.seo?.title || '', seoDescription: p.seo?.description || '',
  };
}

function toBody(f) {
  const body = {
    name: { bn: f.nameBn, en: f.nameEn || undefined },
    category: f.category,
    subcategory: f.subcategory || undefined,
    brand: f.brand || undefined,
    sku: f.sku || undefined,
    shortDescription: { bn: f.shortBn || undefined },
    description: { bn: f.descBn || undefined },
    regularPrice: Number(f.regularPrice),
    salePrice: f.salePrice === '' ? null : Number(f.salePrice),
    stock: Number(f.stock) || 0,
    lowStockThreshold: Number(f.lowStockThreshold) || 0,
    images: f.images.map(pickImage),
    videos: f.videoUrl.trim() ? [{ url: f.videoUrl.trim() }] : [],
    variants: f.variants.map((v) => ({
      _id: v._id,
      color: v.color.trim() || undefined,
      size: v.size.trim() || undefined,
      sku: v.sku.trim() || undefined,
      price: v.price === '' ? null : Number(v.price),
      stock: Number(v.stock) || 0,
      image: v.imageIdx >= 0 && f.images[v.imageIdx] ? pickImage(f.images[v.imageIdx]) : null,
    })),
    materials: splitList(f.materials),
    features: f.features.split('\n').map((x) => x.trim()).filter(Boolean),
    tags: splitList(f.tags),
    specs: f.specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
    isFeatured: f.isFeatured,
    isNewArrival: f.isNewArrival,
    isBestSeller: f.isBestSeller,
    seo: { title: f.seoTitle || undefined, description: f.seoDescription || undefined },
    status: f.status,
  };
  if (f.slug.trim()) body.slug = f.slug.trim();
  return body;
}

function Section({ title, children }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

const selectCls = 'min-h-12 w-full rounded-control border border-line bg-surface px-3';

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/admin/categories').then((r) => setCats(r.data.categories)).catch((e) => toast.error(e.message));
  }, [toast]);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/products/${id}`)
      .then((r) => setForm(toForm(r.data.product)))
      .catch((e) => { if (e.status === 404 || e.status === 400) setNotFound(true); else toast.error(e.message); })
      .finally(() => setLoading(false));
  }, [id, isNew, toast]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const check = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));
  const hasVariants = form.variants.length > 0;
  const nameOf = (c) => (lang === 'en' && c.name?.en) || c.name?.bn;
  const catOptions = useMemo(() => cats.map((c) => ({ id: c._id, label: `${c.parent ? '— ' : ''}${nameOf(c)}` })), [cats, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (isNew) {
        await api.post('/admin/products', toBody(form));
        toast.success(t('admin.products.created'));
      } else {
        await api.patch(`/admin/products/${id}`, toBody(form));
        toast.success(t('admin.products.updated'));
      }
      navigate('/admin/products');
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.details || {}).map(([k, v]) => [k, v[0]])));
      toast.error(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  };

  if (loading) return <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-card bg-surface-2" />)}</div>;
  if (notFound) return <p className="rounded-card border border-line bg-surface p-6 text-muted">{t('admin.products.notFound')}</p>;

  const valid = form.nameBn.trim() && form.category && form.regularPrice !== '' && Number(form.regularPrice) >= 0;
  const errorList = Object.values(errors);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Link to="/admin/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><ArrowLeft size={18} /> {t('admin.products.back')}</Link>

      {errorList.length > 0 && (
        <div role="alert" className="rounded-card border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          <p className="font-semibold">{t('admin.products.fixErrors')}</p>
          <ul className="mt-1 list-disc ps-5">{errorList.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <Section title={t('admin.products.secBasic')}>
        <Input label={t('admin.products.nameBn')} required value={form.nameBn} error={errors.name} onChange={set('nameBn')} />
        <Input label={t('admin.products.nameEn')} value={form.nameEn} onChange={set('nameEn')} />
        <div>
          <label htmlFor="p-cat" className="mb-1.5 block text-sm font-medium">{t('admin.products.category')} *</label>
          <select id="p-cat" value={form.category} onChange={set('category')} className={selectCls} aria-invalid={!!errors.category}>
            <option value="">{t('admin.products.categoryPick')}</option>
            {catOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {errors.category && <p className="mt-1 text-sm text-danger">{errors.category}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('admin.products.brand')} value={form.brand} onChange={set('brand')} />
          <Input label={t('admin.products.sku')} value={form.sku} error={errors.sku} onChange={set('sku')} />
        </div>
        <Input label={t('admin.products.short')} value={form.shortBn} onChange={set('shortBn')} maxLength={300} />
        <div>
          <label htmlFor="p-desc" className="mb-1.5 block text-sm font-medium">{t('admin.products.description')}</label>
          <textarea id="p-desc" rows={6} value={form.descBn} onChange={set('descBn')} className="w-full rounded-control border border-line bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <p className="mt-1 text-sm text-muted">{t('admin.products.descHint')}</p>
        </div>
      </Section>

      <Section title={t('admin.products.secPricing')}>
        <div className="grid grid-cols-2 gap-3">
          <Input label={`${t('admin.products.regularPrice')} (৳) *`} type="number" inputMode="numeric" min="0" value={form.regularPrice} error={errors.regularPrice} onChange={set('regularPrice')} />
          <Input label={`${t('admin.products.salePrice')} (৳)`} type="number" inputMode="numeric" min="0" value={form.salePrice} error={errors.salePrice} hint={t('admin.products.saleHint')} onChange={set('salePrice')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('admin.products.stock')} type="number" inputMode="numeric" min="0" value={form.stock} disabled={hasVariants} hint={hasVariants ? t('admin.products.stockVariantsHint') : undefined} onChange={set('stock')} />
          <Input label={t('admin.products.lowThreshold')} type="number" inputMode="numeric" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
        </div>
      </Section>

      <Section title={t('admin.products.secGallery')}>
        <GalleryEditor images={form.images} onChange={(images) => setForm((f) => ({
          ...f,
          images,
          // keep each variant's image pointing at the same picture after reorder/removal
          variants: f.variants.map((v) => {
            const old = f.images[v.imageIdx];
            return { ...v, imageIdx: old ? images.findIndex((i) => i.url === old.url) : -1 };
          }),
        }))} />
        {errors.images && <p className="text-sm text-danger">{errors.images}</p>}
        <Input label={t('admin.products.videoUrl')} hint={t('admin.products.videoHint')} value={form.videoUrl} error={errors.videos} onChange={set('videoUrl')} />
      </Section>

      <Section title={t('admin.products.secVariants')}>
        <VariantEditor variants={form.variants} images={form.images} onChange={(variants) => setForm((f) => ({ ...f, variants }))} />
        {errors.variants && <p className="text-sm text-danger">{errors.variants}</p>}
      </Section>

      <Section title={t('admin.products.secDetails')}>
        <Input label={t('admin.products.materials')} hint={t('admin.products.commaHint')} value={form.materials} onChange={set('materials')} />
        <div>
          <label htmlFor="p-feat" className="mb-1.5 block text-sm font-medium">{t('admin.products.features')}</label>
          <textarea id="p-feat" rows={4} value={form.features} onChange={set('features')} className="w-full rounded-control border border-line bg-surface p-3 text-base" />
          <p className="mt-1 text-sm text-muted">{t('admin.products.featuresHint')}</p>
        </div>
        <Input label={t('admin.products.tags')} hint={t('admin.products.commaHint')} value={form.tags} onChange={set('tags')} />
        <div>
          <p className="mb-1.5 text-sm font-medium">{t('admin.products.specs')}</p>
          <ul className="flex flex-col gap-2">
            {form.specs.map((s, i) => (
              <li key={i} className="flex gap-2">
                <input aria-label={t('admin.products.specKey')} placeholder={t('admin.products.specKey')} value={s.key} onChange={(e) => setForm((f) => ({ ...f, specs: f.specs.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)) }))} className="min-h-11 min-w-0 flex-1 rounded-control border border-line bg-surface px-3" />
                <input aria-label={t('admin.products.specValue')} placeholder={t('admin.products.specValue')} value={s.value} onChange={(e) => setForm((f) => ({ ...f, specs: f.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) }))} className="min-h-11 min-w-0 flex-1 rounded-control border border-line bg-surface px-3" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, k) => k !== i) }))} aria-label={t('admin.products.removeSpec')} className="grid size-11 shrink-0 place-items-center rounded-control text-danger hover:bg-surface-2"><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" className="mt-2" onClick={() => setForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }))}><Plus size={18} /> {t('admin.products.addSpec')}</Button>
        </div>
      </Section>

      <Section title={t('admin.products.secPublish')}>
        <div className="flex flex-col gap-1">
          {[['isFeatured', 'featured'], ['isNewArrival', 'newArrival'], ['isBestSeller', 'bestSeller']].map(([k, label]) => (
            <label key={k} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" checked={form[k]} onChange={check(k)} className="size-5 accent-[rgb(var(--primary))]" />
              {t(`admin.products.${label}`)}
            </label>
          ))}
        </div>
        <div>
          <label htmlFor="p-status" className="mb-1.5 block text-sm font-medium">{t('admin.products.status')}</label>
          <select id="p-status" value={form.status} onChange={set('status')} className={selectCls}>
            <option value="draft">{t('admin.products.draft')}</option>
            <option value="active">{t('admin.products.active')}</option>
            <option value="archived">{t('admin.products.archived')}</option>
          </select>
          <p className="mt-1 text-sm text-muted">{t('admin.products.statusHint')}</p>
        </div>
        <details className="rounded-control border border-line p-3">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">{t('admin.products.seoSection')}</summary>
          <div className="mt-3 flex flex-col gap-4">
            <Input label={t('admin.categories.slug')} hint={t('admin.categories.slugHint')} value={form.slug} error={errors.slug} onChange={set('slug')} />
            <Input label={t('admin.categories.seoTitle')} value={form.seoTitle} onChange={set('seoTitle')} />
            <Input label={t('admin.categories.seoDescription')} value={form.seoDescription} onChange={set('seoDescription')} />
          </div>
        </details>
      </Section>

      <div
        className="sticky bottom-[4.75rem] z-30 flex gap-3 rounded-card border border-line bg-surface/95 p-3 shadow-soft backdrop-blur md:bottom-4"
      >
        <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/products')}>{t('admin.admins.cancel')}</Button>
        <Button type="submit" className="flex-[2]" disabled={busy || !valid}>
          {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.admins.save')}
        </Button>
      </div>
    </form>
  );
}
