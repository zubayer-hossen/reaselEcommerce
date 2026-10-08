import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, LifeBuoy, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime, formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import { Pill, ContactButtons, TICKET_TONE, PRIORITY_TONE } from './SupportBits.jsx';

const STATUSES = ['open', 'pending', 'resolved', 'all'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const LIMIT = 20;

export default function TicketsPanel({ openId }) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [sort, setSort] = useState('priority');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(false);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState(null);       // { ticket, order } | 'loading'
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { const id = setTimeout(() => setDq(q.trim()), 350); return () => clearTimeout(id); }, [q]);

  const fetchPage = useCallback(async (page) => {
    const params = { page, limit: LIMIT, sort };
    if (status !== 'all') params.status = status;
    if (dq) params.q = dq;
    return (await api.get('/admin/support/tickets', { params })).data;
  }, [status, sort, dq]);

  const reload = useCallback(async () => {
    setError(false); setItems(null);
    try {
      const d = await fetchPage(1);
      setItems(d.tickets); setCounts(d.counts); setMeta({ page: d.page, pages: d.pages, total: d.total });
    } catch (e) { setError(true); toast.error(e.message); }
  }, [fetchPage, toast]);
  useEffect(() => { reload(); }, [reload]);

  const loadMore = async () => {
    setMore(true);
    try { const d = await fetchPage(meta.page + 1); setItems((c) => [...c, ...d.tickets]); setMeta((m) => ({ ...m, page: d.page, pages: d.pages })); }
    catch (e) { toast.error(e.message); } finally { setMore(false); }
  };

  const open = useCallback(async (id) => {
    setSel('loading'); setNote('');
    try { setSel((await api.get(`/admin/support/tickets/${id}`)).data); } catch (e) { setSel(null); toast.error(e.message); }
  }, [toast]);
  useEffect(() => { if (openId) open(openId); }, [openId, open]);

  const patch = async (body) => {
    setBusy(true);
    try { const r = await api.patch(`/admin/support/tickets/${sel.ticket._id}`, body); setSel((s) => ({ ...s, ticket: r.data.ticket })); reload(); toast.success(t('admin.support.saved')); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const addNote = async () => {
    setBusy(true);
    try { const r = await api.post(`/admin/support/tickets/${sel.ticket._id}/notes`, { text: note }); setSel((s) => ({ ...s, ticket: r.data.ticket })); setNote(''); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const tk = sel && sel !== 'loading' ? sel.ticket : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.support.ticketSearch')} aria-label={t('admin.support.ticketSearch')} className="min-h-12 w-full rounded-control border border-line bg-surface ps-10 pe-3" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium ${status === s ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>
              {t(`admin.support.ticket_${s}`)}{counts[s] > 0 && <span className={`rounded-full px-1.5 text-xs ${status === s ? 'bg-white/25' : 'bg-surface-2'}`}>{formatNumber(counts[s], lang)}</span>}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('admin.support.sort')} className="min-h-11 shrink-0 rounded-control border border-line bg-surface px-2 text-sm">
          <option value="priority">{t('admin.support.sortPriority')}</option><option value="recent">{t('admin.support.sortRecent')}</option>
        </select>
      </div>

      {error && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center"><p className="text-danger">{t('admin.support.loadError')}</p><Button variant="outline" className="mt-4" onClick={reload}>{t('admin.dashboard.retry')}</Button></div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center"><LifeBuoy className="mx-auto text-accent" size={32} /><p className="mt-3 font-semibold">{t('admin.support.noTickets')}</p></div>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((x) => (
              <li key={x._id}>
                <button onClick={() => open(x._id)} className="block w-full rounded-card border border-line bg-surface p-4 text-start transition hover:border-primary">
                  <div className="flex items-start justify-between gap-2"><p className="font-bold text-primary">{x.ticketNo}</p><Pill tone={TICKET_TONE[x.status]}>{t(`admin.support.ticket_${x.status}`)}</Pill></div>
                  <p className="mt-1 line-clamp-1 font-semibold">{x.subject}</p>
                  <p className="text-sm text-muted">{x.name} · {t(`public.contact.cat_${x.category}`)}</p>
                  <div className="mt-2 flex items-center gap-2"><Pill tone={PRIORITY_TONE[x.priority]}>{t(`admin.support.prio_${x.priority}`)}</Pill><span className="text-xs text-muted">{formatDateTime(x.createdAt, lang)}</span></div>
                </button>
              </li>
            ))}
          </ul>
          {meta.page < meta.pages && <Button variant="outline" onClick={loadMore} disabled={more} className="self-center">{more && <Loader2 className="animate-spin" size={18} />} {t('admin.products.loadMore')}</Button>}
        </>
      )}

      <BottomSheet open={!!sel} onClose={() => setSel(null)} title={tk ? tk.ticketNo : t('admin.common.loading')} closeLabel={t('admin.common.close')}>
        {!tk ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted" /></div> : (
          <div className="flex flex-col gap-4">
            <div><p className="font-semibold">{tk.subject}</p><p className="text-sm text-muted">{tk.name} · {t(`public.contact.cat_${tk.category}`)} · {formatDateTime(tk.createdAt, lang)}</p></div>
            <p className="whitespace-pre-line rounded-control bg-surface-2 p-3">{tk.message}</p>
            <ContactButtons phone={tk.phone} email={tk.email} subject={tk.subject} />

            {sel.order ? (
              <Link to={`/admin/orders/${sel.order._id || tk.orderRef}`} className="flex min-h-12 items-center justify-between rounded-control border border-line px-3 font-medium text-primary">
                <span>{t('admin.support.linkedOrder')}: {sel.order.orderNo}</span><span className="text-xs text-muted">{t(`admin.orders.status.${sel.order.orderStatus}`)}</span>
              </Link>
            ) : tk.orderNo ? (
              <p className="flex items-start gap-2 rounded-control bg-warning/15 px-3 py-2 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" /> {t('admin.support.unlinkedOrder')}: {tk.orderNo}</p>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="tk-status" className="mb-1 block text-sm font-medium">{t('admin.support.status')}</label>
                <select id="tk-status" value={tk.status} disabled={busy} onChange={(e) => patch({ status: e.target.value })} className="min-h-12 w-full rounded-control border border-line bg-surface px-3">
                  {['open', 'pending', 'resolved'].map((s) => <option key={s} value={s}>{t(`admin.support.ticket_${s}`)}</option>)}
                </select></div>
              <div><label htmlFor="tk-prio" className="mb-1 block text-sm font-medium">{t('admin.support.priority')}</label>
                <select id="tk-prio" value={tk.priority} disabled={busy} onChange={(e) => patch({ priority: e.target.value })} className="min-h-12 w-full rounded-control border border-line bg-surface px-3">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{t(`admin.support.prio_${p}`)}</option>)}
                </select></div>
            </div>

            <div>
              <p className="mb-2 font-semibold">{t('admin.support.notes')}</p>
              {tk.notes?.length > 0 && <ul className="mb-3 flex flex-col gap-2">{tk.notes.map((n) => <li key={n._id} className="rounded-control bg-surface-2 p-3 text-sm"><p className="whitespace-pre-line">{n.text}</p><p className="mt-1 text-xs text-muted">{n.adminName} · {formatDateTime(n.at, lang)}</p></li>)}</ul>}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder={t('admin.support.notePlaceholder')} aria-label={t('admin.support.notes')} className="w-full rounded-control border border-line bg-surface p-3 text-base" />
              <Button variant="outline" className="mt-2" disabled={busy || !note.trim()} onClick={addNote}>{t('admin.support.addNote')}</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
