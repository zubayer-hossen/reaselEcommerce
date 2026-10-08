import { useEffect, useMemo, useState } from 'react';
import { Loader2, Send, Star } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../ui/Toast.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function ReviewsSection({ productId, variantId }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({ orderNo: '', phone: '', title: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get(`/reviews/product/${productId}`, { params: { limit: 10, ...(rating ? { rating } : {}) } }); setReviews(r.data.reviews); setMeta(r.data); }
    catch { setReviews([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [productId, rating]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.orderNo.trim() || !form.phone.trim() || !form.comment.trim() || !form.rating) return;
    setBusy(true);
    try {
      await api.post('/reviews', { ...form, productId, ...(variantId ? { variantId } : {}), rating: form.rating });
      toast.success(t('public.product.reviewSubmitted'));
      setForm({ orderNo: '', phone: '', title: '', comment: '', rating: 0 });
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const stars = useMemo(() => [1,2,3,4,5], []);
  return (
    <section className="mt-12" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="reviews-title" className="font-display text-2xl font-bold">{t('public.product.customerReviews')}</h2><p className="mt-1 text-sm text-muted">{meta.total} {t('public.product.reviews')}</p></div>
        <label className="flex items-center gap-2 text-sm"><span>{t('public.product.filterRating')}</span><select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="min-h-10 rounded-control border border-line bg-surface px-3"><option value="0">{t('public.product.allRatings')}</option>{stars.map((n) => <option key={n} value={n}>{n} ★</option>)}</select></label>
      </div>

      {loading ? <div className="mt-4 h-28 animate-pulse rounded-card bg-surface-2" /> : reviews.length === 0 ? <p className="mt-4 rounded-card border border-dashed border-line p-6 text-sm text-muted">{t('public.product.noReviews')}</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">
        {reviews.map((r) => <article key={r._id} className="rounded-card border border-line bg-surface p-4"><div className="flex items-center gap-1">{stars.map((n) => <Star key={n} size={15} className={n <= r.rating ? 'fill-accent text-accent' : 'text-muted'} />)}<span className="ms-2 text-xs text-muted">{r.isVerifiedPurchase ? t('public.product.verifiedPurchase') : ''}</span></div>{r.title && <h3 className="mt-2 font-semibold">{r.title}</h3>}<p className="mt-2 whitespace-pre-wrap text-sm text-muted">{r.comment}</p><p className="mt-3 text-xs text-muted">{r.customer?.name}</p></article>)}
      </div>}

      <div className="mt-8 rounded-card border border-line bg-surface p-5">
        <h3 className="font-display text-xl font-bold">{t('public.product.writeReview')}</h3>
        <p className="mt-1 text-sm text-muted">{t('public.product.reviewEligibility')}</p>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2" noValidate>
          <Input label={`${t('public.product.orderNo')} *`} value={form.orderNo} onChange={(e) => setForm((f) => ({ ...f, orderNo: e.target.value }))} />
          <Input label={`${t('public.product.phone')} *`} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label={t('public.product.reviewTitle')} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div><label className="mb-1.5 block text-sm font-medium">{t('public.product.yourRating')} *</label><div className="flex min-h-11 items-center gap-1">{stars.map((n) => <button key={n} type="button" aria-label={`${n} ${t('public.product.stars')}`} onClick={() => setForm((f) => ({ ...f, rating: n }))}><Star size={25} className={n <= form.rating ? 'fill-accent text-accent' : 'text-muted'} /></button>)}</div></div>
          <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium">{t('public.product.reviewComment')} *</label><textarea required minLength={5} maxLength={1200} rows={5} value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} className="w-full rounded-control border border-line bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <Button type="submit" disabled={busy || !form.rating || !form.comment.trim()} className="md:col-span-2 sm:w-fit">{busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} {t('public.product.submitReview')}</Button>
        </form>
      </div>
    </section>
  );
}
