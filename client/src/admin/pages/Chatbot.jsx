import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Bot, Loader2, Send, GraduationCap } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime, formatNumber, localized } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import ConfirmSheet from '../../components/ui/ConfirmSheet.jsx';

const empty = { title: '', keywords: '', aBn: '', aEn: '', active: true };
const area = 'w-full rounded-control border border-line bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const splitKw = (s) => [...new Set(s.split(/[,،\n]/).map((x) => x.trim()).filter((x) => x.length >= 2))];

// Try the bot exactly as a customer would (nothing is logged or counted).
function Tester() {
  const { t, lang } = useLanguage();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try { setRes((await api.post('/chatbot/message', { message: q, lang, dry: true })).data.reply); } catch (err) { setRes({ kind: 'error', text: err.message }); } finally { setBusy(false); }
  };
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 font-semibold">{t('admin.chatbot.testTitle')}</h2>
      <form onSubmit={run} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.chatbot.testPlaceholder')} aria-label={t('admin.chatbot.testTitle')} className="min-h-12 min-w-0 flex-1 rounded-control border border-line bg-bg px-3" />
        <Button type="submit" disabled={busy || !q.trim()}>{busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}</Button>
      </form>
      {res && (
        <div className="mt-3 rounded-control bg-surface-2 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t('admin.chatbot.answeredBy')}: {t(`admin.chatbot.kind_${res.kind}`)}</p>
          <p className="whitespace-pre-line">{res.text}</p>
        </div>
      )}
    </section>
  );
}

export default function Chatbot() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [tab, setTab] = useState('knowledge');
  const [items, setItems] = useState(null);
  const [un, setUn] = useState(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [k, u] = await Promise.all([api.get('/admin/chatbot/knowledge'), api.get('/admin/chatbot/unanswered')]);
      setItems(k.data.items); setUn(u.data.items);
    } catch (e) { setError(true); toast.error(e.message); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const openNew = (preset = {}) => { setForm({ ...empty, ...preset }); setErrors({}); setEditing('new'); };
  const openEdit = (k) => { setForm({ title: k.title, keywords: k.keywords.join(', '), aBn: k.answer.bn || '', aEn: k.answer.en || '', active: k.active }); setErrors({}); setEditing(k); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = { title: form.title, keywords: splitKw(form.keywords), answer: { bn: form.aBn, en: form.aEn }, active: form.active };
    try {
      if (editing === 'new') await api.post('/admin/chatbot/knowledge', body); else await api.patch(`/admin/chatbot/knowledge/${editing._id}`, body);
      toast.success(t('admin.chatbot.saved')); setEditing(null); load();
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.details || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  const toggle = async (k) => { try { await api.patch(`/admin/chatbot/knowledge/${k._id}`, { active: !k.active }); load(); } catch (err) { toast.error(err.message); } };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/chatbot/knowledge/${del._id}`); toast.success(t('admin.chatbot.deleted')); setDel(null); load(); }
    catch (err) { toast.error(err.message); setDel(null); } finally { setBusy(false); }
  };
  const dismiss = async (u) => { try { await api.delete(`/admin/chatbot/unanswered/${u._id}`); setUn((l) => l.filter((x) => x._id !== u._id)); } catch (err) { toast.error(err.message); } };
  const teach = (u) => openNew({ title: u.sample.slice(0, 60), keywords: u.sample.split(/\s+/).filter((w) => w.length >= 3).slice(0, 4).join(', ') });

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-card bg-surface-2 p-4 text-sm text-muted">{t('admin.chatbot.intro')}</p>
      <Tester />

      <div className="grid grid-cols-2 gap-1 rounded-control bg-surface-2 p-1" role="tablist">
        {['knowledge', 'unanswered'].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-11 rounded-control text-sm font-semibold ${tab === k ? 'bg-surface shadow' : 'text-muted'}`}>
            {t(`admin.chatbot.tab_${k}`)}{k === 'unanswered' && un?.length > 0 && <span className="ms-2 rounded-full bg-danger px-1.5 text-xs text-white">{formatNumber(un.length, lang)}</span>}
          </button>
        ))}
      </div>

      {error && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center"><p className="text-danger">{t('admin.chatbot.loadError')}</p><Button variant="outline" className="mt-4" onClick={load}>{t('admin.dashboard.retry')}</Button></div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : tab === 'knowledge' ? (
        <>
          <div className="flex justify-end"><Button onClick={() => openNew()}><Plus size={18} /> {t('admin.chatbot.add')}</Button></div>
          {items.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-10 text-center"><Bot className="mx-auto text-accent" size={32} /><p className="mt-3 font-semibold">{t('admin.chatbot.emptyTitle')}</p><p className="mt-1 text-muted">{t('admin.chatbot.emptyText')}</p></div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((k) => (
                <li key={k._id} className={`rounded-card border border-line bg-surface p-4 ${k.active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-semibold">{k.title}</p><p className="mt-1 text-xs text-muted">{k.keywords.join(' · ')}</p><p className="mt-2 line-clamp-2 text-sm">{localized(k.answer, lang)}</p></div>
                    <button onClick={() => toggle(k)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${k.active ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted'}`}>{k.active ? t('admin.faq.active') : t('admin.faq.hidden')}</button>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs text-muted">{formatNumber(k.hits, lang)} {t('admin.chatbot.used')}</span>
                    <button onClick={() => openEdit(k)} className="ms-auto flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium hover:bg-surface-2"><Pencil size={16} /> {t('admin.products.edit')}</button>
                    <button onClick={() => setDel(k)} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-danger hover:bg-surface-2"><Trash2 size={16} /> {t('admin.products.delete')}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        !un || un.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-10 text-center"><GraduationCap className="mx-auto text-accent" size={32} /><p className="mt-3 text-muted">{t('admin.chatbot.noUnanswered')}</p></div>
        ) : (
          <ul className="flex flex-col gap-3">
            {un.map((u) => (
              <li key={u._id} className="rounded-card border border-line bg-surface p-4">
                <p className="font-medium">“{u.sample}”</p>
                <p className="mt-1 text-xs text-muted">{formatNumber(u.count, lang)} {t('admin.chatbot.askedTimes')} · {formatDateTime(u.lastAt, lang)}</p>
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => teach(u)}><GraduationCap size={18} /> {t('admin.chatbot.teach')}</Button>
                  <Button variant="outline" onClick={() => dismiss(u)}>{t('admin.chatbot.dismiss')}</Button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} closeLabel={t('admin.common.close')} title={t(editing === 'new' ? 'admin.chatbot.add' : 'admin.products.edit')}>
        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <Input label={`${t('admin.chatbot.title')} *`} hint={t('admin.chatbot.titleHint')} value={form.title} error={errors.title} onChange={set('title')} />
          <div>
            <label htmlFor="cb-kw" className="mb-1.5 block text-sm font-medium">{t('admin.chatbot.keywords')} *</label>
            <textarea id="cb-kw" rows={2} value={form.keywords} onChange={set('keywords')} className={area} aria-invalid={!!errors.keywords} />
            <p className="mt-1 text-sm text-muted">{t('admin.chatbot.keywordsHint')}</p>
            {errors.keywords && <p className="text-sm text-danger">{errors.keywords}</p>}
          </div>
          <div>
            <label htmlFor="cb-a" className="mb-1.5 block text-sm font-medium">{t('admin.chatbot.answerBn')} *</label>
            <textarea id="cb-a" rows={4} value={form.aBn} onChange={set('aBn')} className={area} aria-invalid={!!(errors['answer.bn'] || errors.answer)} />
            {(errors['answer.bn'] || errors.answer) && <p className="text-sm text-danger">{errors['answer.bn'] || errors.answer}</p>}
          </div>
          <div><label htmlFor="cb-ae" className="mb-1.5 block text-sm font-medium">{t('admin.chatbot.answerEn')}</label><textarea id="cb-ae" rows={3} value={form.aEn} onChange={set('aEn')} className={area} /></div>
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-5 accent-[rgb(var(--primary))]" /> {t('admin.chatbot.active')}</label>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(null)}>{t('admin.admins.cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={busy || !form.title.trim() || !splitKw(form.keywords).length || !form.aBn.trim()}>{busy && <Loader2 className="animate-spin" size={18} />} {t('admin.admins.save')}</Button>
          </div>
        </form>
      </BottomSheet>

      <ConfirmSheet open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger title={t('admin.chatbot.deleteTitle')} text={del?.title} confirmLabel={t('admin.products.delete')} cancelLabel={t('admin.admins.cancel')} closeLabel={t('admin.common.close')} />
    </div>
  );
}
