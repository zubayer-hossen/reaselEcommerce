import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Star, Trash2, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import ConfirmSheet from '../../components/ui/ConfirmSheet.jsx';

const LIMIT = 20;
const statusClass = { pending: 'bg-warning/15 text-warning', approved: 'bg-success/15 text-success', rejected: 'bg-danger/15 text-danger' };

export default function Reviews() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(async () => {
    try { setData((await api.get('/admin/reviews', { params: { page, limit: LIMIT, ...(status ? { status } : {}), ...(q.trim() ? { q: q.trim() } : {}) } })).data); }
    catch (e) { toast.error(e.message); }
  }, [page, q, status, toast]);
  useEffect(() => { load(); }, [load]);

  const moderate = async (id, next) => {
    setBusy(true);
    try { await api.patch(`/admin/reviews/${id}`, { status: next }); toast.success(t('admin.reviews.updated')); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/reviews/${del._id}`); toast.success(t('admin.reviews.deleted')); setDel(null); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const recalculate = async () => {
    setBusy(true);
    try { await api.post('/admin/reviews/recalculate'); toast.success(t('admin.reviews.recalculated')); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const reviews = data?.reviews || [];
  const pages = data?.pages || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><Input label={t('admin.reviews.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t('admin.reviews.searchPlaceholder')} /></div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t('admin.reviews.status')}
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="min-h-11 rounded-control border border-line bg-surface px-3 outline-none focus:border-primary">
            <option value="">{t('admin.reviews.all')}</option><option value="pending">{t('admin.reviews.pending')}</option><option value="approved">{t('admin.reviews.approved')}</option><option value="rejected">{t('admin.reviews.rejected')}</option>
          </select>
        </label>
        <Button variant="outline" onClick={recalculate} disabled={busy}><RotateCcw size={17} /> {t('admin.reviews.recalculate')}</Button>
      </div>

      {!data ? <div className="space-y-3" aria-hidden="true">{[0,1,2].map((i) => <div key={i} className="h-36 animate-pulse rounded-card bg-surface-2" />)}</div> : reviews.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center"><Star className="mx-auto text-accent" size={32} /><p className="mt-3 font-semibold">{t('admin.reviews.emptyTitle')}</p><p className="mt-1 text-muted">{t('admin.reviews.emptyText')}</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => {
            const productName = r.product?.name?.[lang] || r.product?.name?.bn || r.product?.name?.en || t('admin.reviews.unknownProduct');
            return <article key={r._id} className="rounded-card border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{productName}</p>
                  <p className="mt-1 text-sm text-muted">{r.customer?.name} · {r.order?.orderNo || '—'}</p>
                  <div className="mt-2 flex items-center gap-1" aria-label={`${r.rating} / 5`}>
                    {[1,2,3,4,5].map((n) => <Star key={n} size={16} className={n <= r.rating ? 'fill-accent text-accent' : 'text-muted'} />)}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[r.status] || ''}`}>{t(`admin.reviews.${r.status}`)}</span>
              </div>
              {r.title && <h3 className="mt-3 font-semibold">{r.title}</h3>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{r.comment}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== 'approved' && <Button onClick={() => moderate(r._id, 'approved')} disabled={busy}><Check size={16} /> {t('admin.reviews.approve')}</Button>}
                {r.status !== 'rejected' && <Button variant="outline" onClick={() => moderate(r._id, 'rejected')} disabled={busy}><X size={16} /> {t('admin.reviews.reject')}</Button>}
                {r.status !== 'pending' && <Button variant="ghost" onClick={() => moderate(r._id, 'pending')} disabled={busy}>{t('admin.reviews.pending')}</Button>}
                <Button variant="ghost" className="text-danger" onClick={() => setDel(r)} disabled={busy}><Trash2 size={16} /> {t('admin.reviews.delete')}</Button>
              </div>
            </article>;
          })}
        </div>
      )}

      {pages > 1 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={18} /></Button><span className="text-sm text-muted">{page} / {pages}</span><Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={18} /></Button></div>}
      <ConfirmSheet open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger title={t('admin.reviews.deleteTitle')} text={del?.comment || ''} confirmLabel={t('admin.reviews.delete')} cancelLabel={t('admin.admins.cancel')} closeLabel={t('admin.common.close')} />
    </div>
  );
}
