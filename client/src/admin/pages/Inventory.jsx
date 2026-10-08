import { useCallback, useEffect, useState } from 'react';
import { Boxes, Loader2, Check } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { cld } from '../../utils/cloudinary.js';
import { formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';

const TABS = ['low', 'out', 'all'];
const rowKey = (r) => `${r.productId}-${r.variantId || 'p'}`;

export default function Inventory() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const toast = useToast();
  const canWrite = can('products:write');
  const [tab, setTab] = useState('low');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [drafts, setDrafts] = useState({}); // rowKey → new stock text
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setError(false);
    setRows(null);
    try {
      const res = await api.get('/admin/inventory', { params: { filter: tab } });
      setRows(res.data.rows);
      setDrafts({});
    } catch (e) { setError(true); toast.error(e.message); }
  }, [tab, toast]);

  useEffect(() => { load(); }, [load]);

  const save = async (r) => {
    const key = rowKey(r);
    const value = Number(drafts[key]);
    if (!Number.isInteger(value) || value < 0) return;
    setSaving(key);
    try {
      await api.patch(`/admin/products/${r.productId}/stock`, { variantId: r.variantId, stock: value });
      toast.success(t('admin.inventory.saved'));
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(null); }
  };

  const nameOf = (n) => (lang === 'en' && n?.en) || n?.bn;
  const badge = { out: ['admin.products.outOfStock', 'bg-danger/15 text-danger'], low: ['admin.products.lowStock', 'bg-warning/20 text-warning'], ok: ['admin.products.inStock', 'bg-success/15 text-success'] };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {TABS.map((x) => (
          <button key={x} onClick={() => setTab(x)} aria-pressed={tab === x}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${tab === x ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>
            {t(`admin.inventory.tab_${x}`)}
          </button>
        ))}
      </div>

      {error && !rows ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-danger">{t('admin.inventory.loadError')}</p>
          <Button variant="outline" className="mt-4" onClick={load}>{t('admin.dashboard.retry')}</Button>
        </div>
      ) : !rows ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <Boxes className="mx-auto text-accent" size={32} />
          <p className="mt-3 font-semibold">{t('admin.inventory.emptyTitle')}</p>
          <p className="mt-1 text-muted">{t('admin.inventory.emptyText')}</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => {
            const key = rowKey(r);
            const [label, cls] = badge[r.status];
            const draft = drafts[key];
            const dirty = draft !== undefined && draft !== '' && Number(draft) !== r.stock;
            return (
              <li key={key} className="flex gap-3 rounded-card border border-line bg-surface p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-control bg-surface-2">
                  {r.image?.url && <img src={cld(r.image.url, { w: 140, h: 140, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{nameOf(r.name)}</p>
                  <p className="truncate text-sm text-muted">{[r.label, r.sku].filter(Boolean).join(' · ')}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{t(label)}</span>
                    <span className="text-sm text-muted">{formatNumber(r.stock, lang)}</span>
                    {canWrite && (
                      <>
                        <input
                          type="number" inputMode="numeric" min="0" aria-label={t('admin.inventory.newStock')} placeholder={t('admin.inventory.newStock')}
                          value={draft ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                          className="ms-auto min-h-11 w-20 rounded-control border border-line bg-surface px-2 text-center"
                        />
                        <button onClick={() => save(r)} disabled={!dirty || saving === key} aria-label={t('admin.admins.save')}
                          className="grid size-11 place-items-center rounded-control bg-primary text-primary-fg disabled:opacity-40">
                          {saving === key ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
