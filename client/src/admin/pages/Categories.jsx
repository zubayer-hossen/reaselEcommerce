import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, Pencil, Trash2, FolderTree } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { cld } from '../../utils/cloudinary.js';
import { formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import ImageUploader from '../../components/ui/ImageUploader.jsx';

const emptyForm = {
  nameBn: '', nameEn: '', slug: '', descBn: '', image: null, icon: '',
  parent: '', order: 0, status: 'active', seoTitle: '', seoDescription: '',
};

const toForm = (c) => ({
  nameBn: c.name?.bn || '', nameEn: c.name?.en || '', slug: c.slug || '', descBn: c.description?.bn || '',
  image: c.image || null, icon: c.icon || '', parent: c.parent || '', order: c.order ?? 0,
  status: c.status || 'active', seoTitle: c.seo?.title || '', seoDescription: c.seo?.description || '',
});

export default function Categories() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await api.get('/admin/categories');
      setItems(res.data.categories);
    } catch (e) {
      setLoadError(true);
      toast.error(e.message);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const topLevel = useMemo(() => (items || []).filter((c) => !c.parent), [items]);
  const nameOf = (c) => (lang === 'en' && c.name?.en) || c.name?.bn;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(emptyForm); setErrors({}); setEditing('new'); };
  const openEdit = (c) => { setForm(toForm(c)); setErrors({}); setEditing(c); };
  const close = () => setEditing(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = {
      name: { bn: form.nameBn, en: form.nameEn || undefined },
      description: { bn: form.descBn || undefined },
      image: form.image,
      icon: form.icon || undefined,
      parent: form.parent || null,
      order: Number(form.order) || 0,
      status: form.status,
      seo: { title: form.seoTitle || undefined, description: form.seoDescription || undefined },
    };
    if (form.slug.trim()) body.slug = form.slug.trim();

    try {
      if (editing === 'new') await api.post('/admin/categories', body);
      else await api.patch(`/admin/categories/${editing._id}`, body);
      toast.success(t(editing === 'new' ? 'admin.categories.created' : 'admin.categories.updated'));
      close();
      load();
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.details || {}).map(([k, v]) => [k, v[0]])));
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/categories/${toDelete._id}`);
      toast.success(t('admin.categories.deleted'));
      setToDelete(null);
      load();
    } catch (err) { toast.error(err.message); setToDelete(null); }
    finally { setBusy(false); }
  };

  const toggle = async (c) => {
    try {
      await api.patch(`/admin/categories/${c._id}`, { status: c.status === 'active' ? 'inactive' : 'active' });
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus size={18} /> {t('admin.categories.add')}</Button>
      </div>

      {loadError && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-danger">{t('admin.categories.loadError')}</p>
          <Button variant="outline" className="mt-4" onClick={load}>{t('admin.dashboard.retry')}</Button>
        </div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <FolderTree className="mx-auto text-accent" size={32} />
          <p className="mt-3 font-semibold">{t('admin.categories.emptyTitle')}</p>
          <p className="mt-1 text-muted">{t('admin.categories.emptyText')}</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((c) => {
            const parent = c.parent ? items.find((p) => p._id === c.parent) : null;
            return (
              <li key={c._id} className="flex gap-3 rounded-card border border-line bg-surface p-3">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2 text-2xl">
                  {c.image?.url ? <img src={cld(c.image.url, { w: 160, h: 160, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover" /> : (c.icon || <FolderTree className="text-muted" size={24} />)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{nameOf(c)}</p>
                    <button
                      onClick={() => toggle(c)}
                      aria-label={c.status === 'active' ? t('admin.categories.disable') : t('admin.categories.enable')}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${c.status === 'active' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}
                    >
                      {c.status === 'active' ? t('admin.categories.active') : t('admin.categories.inactive')}
                    </button>
                  </div>
                  <p className="truncate text-sm text-muted">
                    {parent ? `${nameOf(parent)} › ` : ''}{formatNumber(c.productCount, lang)} {t('admin.categories.products')}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => openEdit(c)} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium hover:bg-surface-2"><Pencil size={16} /> {t('admin.categories.edit')}</button>
                    <button onClick={() => setToDelete(c)} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-danger hover:bg-surface-2"><Trash2 size={16} /> {t('admin.categories.delete')}</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create / edit */}
      <BottomSheet open={!!editing} onClose={close} closeLabel={t('admin.common.close')} title={t(editing === 'new' ? 'admin.categories.add' : 'admin.categories.edit')}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.categories.nameBn')} required value={form.nameBn} error={errors.name} onChange={set('nameBn')} />
          <Input label={t('admin.categories.nameEn')} value={form.nameEn} onChange={set('nameEn')} />
          <ImageUploader label={t('admin.categories.image')} folder="categories" value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} />
          <Input label={t('admin.categories.icon')} hint={t('admin.categories.iconHint')} value={form.icon} maxLength={8} onChange={set('icon')} />
          <div>
            <label htmlFor="cat-parent" className="mb-1.5 block text-sm font-medium">{t('admin.categories.parent')}</label>
            <select id="cat-parent" value={form.parent} onChange={set('parent')} className="min-h-12 w-full rounded-control border border-line bg-surface px-3">
              <option value="">{t('admin.categories.parentNone')}</option>
              {topLevel.filter((c) => editing === 'new' || c._id !== editing?._id).map((c) => <option key={c._id} value={c._id}>{nameOf(c)}</option>)}
            </select>
            {errors.parent && <p className="mt-1 text-sm text-danger">{errors.parent}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.categories.order')} type="number" inputMode="numeric" min="0" value={form.order} onChange={set('order')} />
            <div>
              <label htmlFor="cat-status" className="mb-1.5 block text-sm font-medium">{t('admin.categories.status')}</label>
              <select id="cat-status" value={form.status} onChange={set('status')} className="min-h-12 w-full rounded-control border border-line bg-surface px-3">
                <option value="active">{t('admin.categories.active')}</option>
                <option value="inactive">{t('admin.categories.inactive')}</option>
              </select>
            </div>
          </div>
          <details className="rounded-control border border-line p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">{t('admin.categories.advanced')}</summary>
            <div className="mt-3 flex flex-col gap-4">
              <Input label={t('admin.categories.slug')} hint={t('admin.categories.slugHint')} value={form.slug} error={errors.slug} onChange={set('slug')} />
              <Input label={t('admin.categories.description')} value={form.descBn} onChange={set('descBn')} />
              <Input label={t('admin.categories.seoTitle')} value={form.seoTitle} onChange={set('seoTitle')} />
              <Input label={t('admin.categories.seoDescription')} value={form.seoDescription} onChange={set('seoDescription')} />
            </div>
          </details>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>{t('admin.admins.cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={busy || !form.nameBn.trim()}>
              {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.admins.save')}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete confirmation */}
      <BottomSheet open={!!toDelete} onClose={() => setToDelete(null)} closeLabel={t('admin.common.close')} title={t('admin.categories.deleteTitle')}>
        <p className="text-muted">{t('admin.categories.deleteText')} <strong className="text-ink">{toDelete && nameOf(toDelete)}</strong></p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setToDelete(null)}>{t('admin.admins.cancel')}</Button>
          <Button className="flex-1 !bg-danger !text-white" onClick={remove} disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.categories.delete')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
