import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Copy, Check, AlertTriangle, PackageX, Plus, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { MAIN_FLOW } from '../../constants/orderStatus.js';
import { cld } from '../../utils/cloudinary.js';
import { formatDateTime, formatMoney, formatNumber, localized } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import ConfirmSheet from '../../components/ui/ConfirmSheet.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import { OrderStatusBadge, PayStatusBadge } from '../components/StatusBadge.jsx';

function Card({ title, children, action }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  if (children == null || children === '') return null;
  return <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="shrink-0 text-muted">{label}</dt><dd className="break-all text-end font-medium">{children}</dd></div>;
}

function CopyBtn({ value, label }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={label}
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* blocked */ } }}
      className="grid size-9 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2">
      {done ? <Check size={16} className="text-success" /> : <Copy size={16} />}
    </button>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | notFound | error
  const [target, setTarget] = useState(null);     // status being confirmed
  const [form, setForm] = useState({ message: '', visible: true, eta: '' });
  const [payAction, setPayAction] = useState(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const [track, setTrack] = useState({ message: '', visible: true });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/admin/orders/${id}`);
      setData(res.data);
      setNote(res.data.order.adminNote || '');
      setState('ok');
    } catch (e) { setState(e.status === 404 || e.status === 400 ? 'notFound' : 'error'); }
  }, [id]);

  useEffect(() => { setState('loading'); load(); }, [load]);

  const run = async (fn, okKey) => {
    setBusy(true);
    try { await fn(); toast.success(t(okKey)); await load(); return true; }
    catch (e) { toast.error(e.message); if (e.status === 409) load(); return false; }
    finally { setBusy(false); }
  };

  const openStatus = (status) => { setForm({ message: '', visible: true, eta: '' }); setTarget(status); };
  const confirmStatus = async () => {
    const body = { status: target, visibleToCustomer: form.visible };
    if (form.message.trim()) body.message = { bn: form.message.trim() };
    if (form.eta) body.estimatedDelivery = form.eta;
    if (await run(() => api.patch(`/admin/orders/${id}/status`, body), 'admin.orders.statusUpdated')) setTarget(null);
  };
  const confirmPayment = async () => {
    if (await run(() => api.patch(`/admin/orders/${id}/payment`, { status: payAction }), 'admin.orders.paymentUpdated')) setPayAction(null);
  };
  const saveTrack = async () => {
    if (await run(() => api.post(`/admin/orders/${id}/tracking`, { message: { bn: track.message.trim() }, visibleToCustomer: track.visible }), 'admin.orders.trackingAdded')) {
      setTrackOpen(false); setTrack({ message: '', visible: true });
    }
  };

  if (state === 'loading') return <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-card bg-surface-2" />)}</div>;
  if (state !== 'ok') {
    return (
      <div className="rounded-card border border-line bg-surface p-10 text-center">
        <PackageX className="mx-auto text-accent" size={36} />
        <p className="mt-3 font-semibold">{state === 'notFound' ? t('admin.orders.notFound') : t('admin.orders.loadError')}</p>
        <Link to="/admin/orders" className="mt-4 inline-flex min-h-11 items-center rounded-control border border-line px-5 font-medium">{t('admin.orders.back')}</Link>
      </div>
    );
  }

  const { order: o, payment, events, customer, allowedNext } = data;
  const canUpdate = can('orders:update');
  const canPay = can('payments:update');
  const canTrack = can('tracking:write');
  const nextMain = allowedNext.find((s) => MAIN_FLOW.includes(s));
  const exits = allowedNext.filter((s) => !MAIN_FLOW.includes(s) || s !== nextMain);
  const wa = `https://wa.me/88${o.customer.phone}`;
  const addressLine = [o.customer.address, o.customer.area, o.customer.district, o.customer.postalCode].filter(Boolean).join(', ');
  const mismatch = payment && payment.amount !== (o.advanceAmount ?? o.total) && o.paymentMethod !== 'cod';
  const releases = ['cancelled', 'failed', 'returned'].includes(target);
  const showEta = target && !['cancelled', 'failed', 'returned', 'delivered'].includes(target);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <Link to="/admin/orders" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><ArrowLeft size={18} /> {t('admin.orders.back')}</Link>

      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1 text-xl font-bold tracking-wide text-primary">{o.orderNo} <CopyBtn value={o.orderNo} label={t('admin.orders.copy')} /></p>
            <p className="text-sm text-muted">{formatDateTime(o.createdAt, lang)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5"><OrderStatusBadge status={o.orderStatus} /><PayStatusBadge status={o.paymentStatus} /></div>
        </div>
      </div>

      {/* Status actions */}
      {canUpdate && (
        <Card title={t('admin.orders.changeStatus')}>
          {allowedNext.length === 0 ? <p className="text-muted">{t('admin.orders.noActions')}</p> : (
            <div className="flex flex-col gap-3">
              {nextMain && <Button className="min-h-14 text-base" onClick={() => openStatus(nextMain)}>{t('admin.orders.moveTo')} {t(`admin.orders.status.${nextMain}`)}</Button>}
              <div className="flex flex-wrap gap-2">
                {exits.map((s) => (
                  <Button key={s} variant="outline" onClick={() => openStatus(s)} className={['cancelled', 'failed'].includes(s) ? '!border-danger/50 !text-danger' : ''}>{t(`admin.orders.status.${s}`)}</Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Customer */}
      <Card title={t('admin.orders.customer')}>
        <p className="text-lg font-semibold">{o.customer.name}</p>
        <p className="mt-1 text-muted">{addressLine}</p>
        {o.customer.email && <p className="mt-1 break-all text-sm text-muted">{o.customer.email}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`tel:${o.customer.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary font-medium text-primary-fg"><Phone size={18} /> {o.customer.phone}</a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line font-medium"><MessageCircle size={18} /> WhatsApp</a>
        </div>
        <button type="button" onClick={() => navigator.clipboard?.writeText(addressLine)} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><Copy size={16} /> {t('admin.orders.copyAddress')}</button>
        {o.note && <p className="mt-3 rounded-control bg-warning/10 px-3 py-2 text-sm"><strong>{t('admin.orders.customerNote')}:</strong> {o.note}</p>}
        {customer && <p className="mt-3 text-sm text-muted">{t('admin.orders.history')}: {formatNumber(customer.orderCount, lang)} {t('admin.orders.ordersWord')} · {formatMoney(customer.totalSpent, lang)}</p>}
      </Card>

      {/* Items */}
      <Card title={t('admin.orders.items')}>
        <ul className="divide-y divide-line">
          {o.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 py-2.5">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">{i.image && <img src={cld(i.image, { w: 120, h: 120, crop: 'fill' })} alt="" className="size-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-medium">{i.name}</span>
                <span className="block text-sm text-muted">{[i.color, i.size, i.sku].filter(Boolean).join(' · ')} × {formatNumber(i.qty, lang)}</span>
              </span>
              <span className="font-semibold">{formatMoney(i.price * i.qty, lang)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 border-t border-line pt-2">
          <Row label={t('public.cart.subtotal')}>{formatMoney(o.subtotal, lang)}</Row>
          {o.discount > 0 && <Row label={`${t('public.cart.discount')}${o.coupon?.code ? ` (${o.coupon.code})` : ''}`}>-{formatMoney(o.discount, lang)}</Row>}
          <Row label={t('public.cart.deliveryCharge')}>{formatMoney(o.deliveryCharge, lang)}</Row>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold"><dt>{t('public.cart.total')}</dt><dd className="text-primary">{formatMoney(o.total, lang)}</dd></div>
          <Row label={lang === 'bn' ? 'অগ্রিম জমা (যাচাই সাপেক্ষে)' : 'Advance submitted (pending verification)'}>{formatMoney(o.advanceAmount ?? 150, lang)}</Row>
          <Row label={lang === 'bn' ? 'বাকি পরিশোধযোগ্য' : 'Remaining balance'}>{formatMoney(o.balanceDue ?? Math.max(0, o.total - 150), lang)}</Row>
        </dl>
      </Card>

      {/* Payment */}
      <Card title={t('admin.orders.payment')} action={<PayStatusBadge status={o.paymentStatus} />}>
        <dl>
          <Row label={t('admin.orders.method')}>{t(`public.checkout.methods.${o.paymentMethod}`)}</Row>
          {payment && <>
            <Row label={t('public.checkout.senderPhone')}>{payment.senderPhone}</Row>
            <Row label={t('public.checkout.trxId')}>{payment.trxId && <span className="inline-flex items-center gap-1">{payment.trxId}<CopyBtn value={payment.trxId} label={t('admin.orders.copy')} /></span>}</Row>
            <Row label={t('public.checkout.yourBank')}>{payment.bankName}</Row>
            <Row label={t('public.checkout.reference')}>{payment.reference}</Row>
            <Row label={t('public.checkout.provider')}>{payment.provider}</Row>
            <Row label={t('public.checkout.paymentDate')}>{payment.paymentDate && formatDateTime(payment.paymentDate, lang)}</Row>
            <Row label={t('admin.orders.paidAmount')}>{formatMoney(payment.amount, lang)}</Row>
            <Row label={t('public.checkout.paymentNotes')}>{payment.notes}</Row>
          </>}
        </dl>
        {mismatch && (
          <p role="alert" className="mt-2 flex items-start gap-2 rounded-control bg-warning/15 px-3 py-2 text-sm"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" /> {t('admin.orders.mismatch')} ({formatMoney(payment.amount, lang)} ≠ {formatMoney(o.advanceAmount ?? 150, lang)})</p>
        )}
        {o.paymentMethod === 'cod' && o.paymentStatus === 'pending' && <p className="mt-2 text-sm text-muted">{t('admin.orders.codNote')}</p>}
        {canPay && payment && o.paymentMethod !== 'cod' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {['pending', 'submitted', 'rejected'].includes(o.paymentStatus) && <Button onClick={() => setPayAction('verified')}>{t('admin.orders.verify')}</Button>}
            {['pending', 'submitted', 'verified'].includes(o.paymentStatus) && <Button variant="outline" className="!border-danger/50 !text-danger" onClick={() => setPayAction('rejected')}>{t('admin.orders.reject')}</Button>}
            {o.paymentStatus === 'verified' && <Button variant="outline" onClick={() => setPayAction('refunded')}>{t('admin.orders.refund')}</Button>}
          </div>
        )}
      </Card>

      {/* Tracking */}
      <Card title={t('admin.orders.timeline')} action={canTrack && <button onClick={() => setTrackOpen(true)} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-primary hover:bg-surface-2"><Plus size={16} /> {t('admin.orders.addUpdate')}</button>}>
        <ol className="relative ms-2 border-s-2 border-line ps-5">
          {[...events].reverse().map((ev) => (
            <li key={ev._id} className="mb-5 last:mb-0">
              <span className="absolute -start-[7px] mt-1.5 size-3 rounded-full bg-primary" />
              <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={ev.status} />{!ev.visibleToCustomer && <span className="flex items-center gap-1 text-xs text-muted"><EyeOff size={12} /> {t('admin.orders.hidden')}</span>}</div>
              <p className="mt-1">{localized(ev.message, lang)}</p>
              <p className="text-xs text-muted">{formatDateTime(ev.createdAt, lang)}{ev.createdBy?.name ? ` · ${ev.createdBy.name}` : ''}</p>
            </li>
          ))}
        </ol>
        {o.estimatedDelivery && <p className="mt-3 text-sm text-muted">{t('admin.orders.eta')}: {formatDateTime(o.estimatedDelivery, lang)}</p>}
      </Card>

      {/* Internal note */}
      {canUpdate && (
        <Card title={t('admin.orders.adminNote')}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className="w-full rounded-control border border-line bg-surface p-3 text-base" aria-label={t('admin.orders.adminNote')} />
          <Button variant="outline" className="mt-2" disabled={busy || note === (o.adminNote || '')} onClick={() => run(() => api.patch(`/admin/orders/${id}/note`, { adminNote: note }), 'admin.orders.noteSaved')}>{t('admin.admins.save')}</Button>
        </Card>
      )}

      {/* Technical metadata */}
      <Card title={t('admin.orders.security')}>
        <p className="mb-2 text-xs text-muted">{t('admin.orders.securityNote')}</p>
        <dl>
          <Row label="IP">{o.meta?.ip}</Row>
          <Row label={t('admin.orders.device')}>{o.meta?.device}</Row>
          <Row label={t('admin.orders.browser')}>{o.meta?.browser}</Row>
          <Row label="OS">{o.meta?.os}</Row>
          <Row label={t('admin.orders.source')}>{o.meta?.source}</Row>
          <Row label={t('admin.orders.deliveryArea')}>{o.deliveryArea}</Row>
        </dl>
      </Card>

      {/* Status confirmation */}
      <ConfirmSheet open={!!target} onClose={() => setTarget(null)} onConfirm={confirmStatus} busy={busy}
        title={target ? `${t('admin.orders.moveTo')} ${t(`admin.orders.status.${target}`)}` : ''}
        confirmLabel={t('admin.orders.confirm')} cancelLabel={t('admin.admins.cancel')} closeLabel={t('admin.common.close')}
        danger={['cancelled', 'failed'].includes(target)}>
        <div className="mt-2 flex flex-col gap-4">
          {releases && <p role="note" className="rounded-control bg-warning/15 px-3 py-2 text-sm">{t('admin.orders.restockWarning')}</p>}
          <div>
            <label htmlFor="st-msg" className="mb-1.5 block text-sm font-medium">{t('admin.orders.messageLabel')}</label>
            <textarea id="st-msg" rows={2} maxLength={300} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t('admin.orders.messageHint')} className="w-full rounded-control border border-line bg-surface p-3 text-base" />
          </div>
          {showEta && (
            <div>
              <label htmlFor="st-eta" className="mb-1.5 block text-sm font-medium">{t('admin.orders.etaLabel')}</label>
              <input id="st-eta" type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} className="min-h-12 w-full rounded-control border border-line bg-surface px-3" />
            </div>
          )}
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} className="size-5 accent-[rgb(var(--primary))]" /> {t('admin.orders.notifyCustomer')}</label>
        </div>
      </ConfirmSheet>

      {/* Payment confirmation */}
      <ConfirmSheet open={!!payAction} onClose={() => setPayAction(null)} onConfirm={confirmPayment} busy={busy}
        title={payAction ? t(`admin.orders.pay_${payAction}_title`) : ''} text={payAction ? t(`admin.orders.pay_${payAction}_text`) : ''}
        confirmLabel={t('admin.orders.confirm')} cancelLabel={t('admin.admins.cancel')} closeLabel={t('admin.common.close')} danger={payAction === 'rejected'} />

      {/* Custom tracking message */}
      <BottomSheet open={trackOpen} onClose={() => setTrackOpen(false)} title={t('admin.orders.addUpdate')} closeLabel={t('admin.common.close')}>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="tr-msg" className="mb-1.5 block text-sm font-medium">{t('admin.orders.updateMessage')}</label>
            <textarea id="tr-msg" rows={3} maxLength={300} value={track.message} onChange={(e) => setTrack({ ...track, message: e.target.value })} className="w-full rounded-control border border-line bg-surface p-3 text-base" />
          </div>
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={track.visible} onChange={(e) => setTrack({ ...track, visible: e.target.checked })} className="size-5 accent-[rgb(var(--primary))]" /> {t('admin.orders.notifyCustomer')}</label>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setTrackOpen(false)}>{t('admin.admins.cancel')}</Button>
            <Button className="flex-1" onClick={saveTrack} disabled={busy || !track.message.trim()}>{busy && <Loader2 className="animate-spin" size={18} />} {t('admin.admins.save')}</Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
