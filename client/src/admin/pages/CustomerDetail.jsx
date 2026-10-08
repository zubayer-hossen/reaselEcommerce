import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Copy, UserX } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import { OrderStatusBadge } from '../components/StatusBadge.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/admin/customers/${id}`);
      setData(r.data);
      setNotes(r.data.customer.notes || '');
      setState('ok');
    } catch (e) { setState(e.status === 404 || e.status === 400 ? 'notFound' : 'error'); }
  }, [id]);
  useEffect(() => { setState('loading'); load(); }, [load]);

  const saveNotes = async () => {
    setBusy(true);
    try { await api.patch(`/admin/customers/${id}`, { notes }); toast.success(t('admin.customers.noteSaved')); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (state === 'loading') return <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-2" />)}</div>;
  if (state !== 'ok') {
    return (
      <div className="rounded-card border border-line bg-surface p-10 text-center">
        <UserX className="mx-auto text-accent" size={36} />
        <p className="mt-3 font-semibold">{state === 'notFound' ? t('admin.customers.notFound') : t('admin.customers.loadError')}</p>
        <Link to="/admin/customers" className="mt-4 inline-flex min-h-11 items-center rounded-control border border-line px-5 font-medium">{t('admin.customers.back')}</Link>
      </div>
    );
  }

  const { customer: c, orders } = data;
  const yes = t('admin.customers.yes');
  const no = t('admin.customers.no');

  return (
    <div className="flex flex-col gap-4 pb-6">
      <Link to="/admin/customers" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><ArrowLeft size={18} /> {t('admin.customers.back')}</Link>

      <section className="rounded-card border border-line bg-surface p-4">
        <h1 className="text-xl font-bold">{c.name}</h1>
        <p className="text-sm text-muted">{t('admin.customers.since')}: {formatDateTime(c.createdAt, lang)}</p>
        {c.email && <p className="mt-1 break-all text-sm text-muted">{c.email}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`tel:${c.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary font-medium text-primary-fg"><Phone size={18} /> {c.phone}</a>
          <a href={`https://wa.me/88${c.phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line font-medium"><MessageCircle size={18} /> WhatsApp</a>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-control bg-surface-2 p-3"><p className="text-xl font-bold">{formatNumber(c.orderCount, lang)}</p><p className="text-xs text-muted">{t('admin.customers.ordersWord')}</p></div>
          <div className="rounded-control bg-surface-2 p-3"><p className="text-xl font-bold text-primary">{formatMoney(c.totalSpent, lang)}</p><p className="text-xs text-muted">{t('admin.customers.spent')}</p></div>
          <div className="rounded-control bg-surface-2 p-3"><p className="text-sm font-semibold">{c.lastOrderAt ? formatDateTime(c.lastOrderAt, lang) : '—'}</p><p className="text-xs text-muted">{t('admin.customers.lastOrder')}</p></div>
        </div>
      </section>

      {c.addresses?.length > 0 && (
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-2 font-semibold">{t('admin.customers.addresses')}</h2>
          <ul className="divide-y divide-line">
            {c.addresses.map((a, i) => {
              const line = [a.address, a.area, a.district, a.postalCode].filter(Boolean).join(', ');
              return (
                <li key={i} className="flex items-start justify-between gap-2 py-2.5">
                  <span className="text-sm">{line}</span>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(line)} aria-label={t('admin.customers.copy')} className="grid size-10 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2"><Copy size={16} /></button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold">{t('admin.customers.consent')}</h2>
        <p className="text-sm">{t('admin.customers.consentEmail')}: <strong>{c.marketingConsent?.email ? yes : no}</strong></p>
        <p className="text-sm">{t('admin.customers.consentSms')}: <strong>{c.marketingConsent?.sms ? yes : no}</strong></p>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold">{t('admin.customers.recentOrders')}</h2>
        {orders.length === 0 ? <p className="text-sm text-muted">{t('admin.customers.noOrders')}</p> : (
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o._id}>
                <Link to={`/admin/orders/${o._id}`} className="flex min-h-14 items-center justify-between gap-3 py-2">
                  <span><span className="block font-semibold text-primary">{o.orderNo}</span><span className="text-xs text-muted">{formatDateTime(o.createdAt, lang)}</span></span>
                  <span className="flex flex-col items-end gap-1"><span className="font-semibold">{formatMoney(o.total, lang)}</span><OrderStatusBadge status={o.orderStatus} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {can('customers:write') && (
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-2 font-semibold">{t('admin.customers.notes')}</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} aria-label={t('admin.customers.notes')} className="w-full rounded-control border border-line bg-surface p-3 text-base" />
          <Button variant="outline" className="mt-2" disabled={busy || notes === (c.notes || '')} onClick={saveNotes}>{t('admin.admins.save')}</Button>
        </section>
      )}
    </div>
  );
}
