import { useCallback, useEffect, useState } from 'react';
import { Search, Inbox, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime, formatNumber } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import { Pill, ContactButtons, MSG_TONE } from './SupportBits.jsx';

const STATUSES = ['new', 'read', 'replied', 'closed', 'all'];
const LIMIT = 20;

export default function MessagesPanel({ openId }) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [status, setStatus] = useState('new');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(false);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { const id = setTimeout(() => setDq(q.trim()), 350); return () => clearTimeout(id); }, [q]);

  const fetchPage = useCallback(async (page) => {
    const params = { page, limit: LIMIT };
    if (status !== 'all') params.status = status;
    if (dq) params.q = dq;
    return (await api.get('/admin/support/messages', { params })).data;
  }, [status, dq]);

  const reload = useCallback(async () => {
    setError(false); setItems(null);
    try { const d = await fetchPage(1); setItems(d.messages); setCounts(d.counts); setMeta({ page: d.page, pages: d.pages, total: d.total }); }
    catch (e) { setError(true); toast.error(e.message); }
  }, [fetchPage, toast]);
  useEffect(() => { reload(); }, [reload]);

  const loadMore = async () => {
    setMore(true);
    try { const d = await fetchPage(meta.page + 1); setItems((c) => [...c, ...d.messages]); setMeta((m) => ({ ...m, page: d.page, pages: d.pages })); }
    catch (e) { toast.error(e.message); } finally { setMore(false); }
  };

  // opening a "new" message marks it as read on the server
  const open = useCallback(async (id) => {
    setSel('loading');
    try { const m = (await api.get(`/admin/support/messages/${id}`)).data.message; setSel(m); setNote(m.adminNote || ''); reload(); }
    catch (e) { setSel(null); toast.error(e.message); }
  }, [reload, toast]);
  useEffect(() => { if (openId) open(openId); }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (body) => {
    setBusy(true);
    try { const r = await api.patch(`/admin/support/messages/${sel._id}`, body); setSel(r.data.message); reload(); toast.success(t('admin.support.saved')); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const m = sel && sel !== 'loading' ? sel : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.support.messageSearch')} aria-label={t('admin.support.messageSearch')} className="min-h-12 w-full rounded-control border border-line bg-surface ps-10 pe-3" />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium ${status === s ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>
            {t(`admin.support.msg_${s}`)}{counts[s] > 0 && <span className={`rounded-full px-1.5 text-xs ${status === s ? 'bg-white/25' : 'bg-surface-2'}`}>{formatNumber(counts[s], lang)}</span>}
          </button>
        ))}
      </div>

      {error && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center"><p className="text-danger">{t('admin.support.loadError')}</p><Button variant="outline" className="mt-4" onClick={reload}>{t('admin.dashboard.retry')}</Button></div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center"><Inbox className="mx-auto text-accent" size={32} /><p className="mt-3 font-semibold">{t('admin.support.noMessages')}</p></div>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((x) => (
              <li key={x._id}>
                <button onClick={() => open(x._id)} className={`block w-full rounded-card border bg-surface p-4 text-start transition hover:border-primary ${x.status === 'new' ? 'border-primary/50' : 'border-line'}`}>
                  <div className="flex items-start justify-between gap-2"><p className="font-semibold">{x.name}</p><Pill tone={MSG_TONE[x.status]}>{t(`admin.support.msg_${x.status}`)}</Pill></div>
                  <p className="mt-1 line-clamp-1 font-medium">{x.subject}</p>
                  <p className="line-clamp-2 text-sm text-muted">{x.message}</p>
                  <p className="mt-2 text-xs text-muted">{formatDateTime(x.createdAt, lang)}</p>
                </button>
              </li>
            ))}
          </ul>
          {meta.page < meta.pages && <Button variant="outline" onClick={loadMore} disabled={more} className="self-center">{more && <Loader2 className="animate-spin" size={18} />} {t('admin.products.loadMore')}</Button>}
        </>
      )}

      <BottomSheet open={!!sel} onClose={() => setSel(null)} title={m ? m.subject : t('admin.common.loading')} closeLabel={t('admin.common.close')}>
        {!m ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted" /></div> : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">{m.name} · {formatDateTime(m.createdAt, lang)}</p>
            <p className="whitespace-pre-line rounded-control bg-surface-2 p-3">{m.message}</p>
            <ContactButtons phone={m.phone} email={m.email} subject={m.subject} />
            <div className="flex flex-wrap gap-2">
              {['replied', 'closed', 'read'].map((s) => (
                <Button key={s} variant={m.status === s ? 'primary' : 'outline'} disabled={busy || m.status === s} onClick={() => patch({ status: s })}>{t(`admin.support.mark_${s}`)}</Button>
              ))}
            </div>
            <div>
              <label htmlFor="msg-note" className="mb-1 block text-sm font-medium">{t('admin.support.internalNote')}</label>
              <textarea id="msg-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-control border border-line bg-surface p-3 text-base" />
              <Button variant="outline" className="mt-2" disabled={busy || note === (m.adminNote || '')} onClick={() => patch({ adminNote: note })}>{t('admin.admins.save')}</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
