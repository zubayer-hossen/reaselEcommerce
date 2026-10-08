import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, HelpCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { localized } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';
import ConfirmSheet from '../../components/ui/ConfirmSheet.jsx';

const empty = { qBn: '', qEn: '', aBn: '', aEn: '', category: '', active: true };
const area = 'w-full rounded-control border border-line bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function Faqs() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | faq
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(async () => {
    setError(false);
    try { setItems((await api.get('/admin/faqs')).data.faqs); } catch (e) { setError(true); toast.error(e.message); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErrors({}); setEditing('new'); };
  const openEdit = (f) => { setForm({ qBn: f.question.bn || '', qEn: f.question.en || '', aBn: f.answer.bn || '', aEn: f.answer.en || '', category: f.category || '', active: f.active }); setErrors({}); setEditing(f); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = { question: { bn: form.qBn, en: form.qEn }, answer: { bn: form.aBn, en: form.aEn }, category: form.category, active: form.active };
    try {
      if (editing === 'new') await api.post('/admin/faqs', body); else await api.patch(`/admin/faqs/${editing._id}`, body);
      toast.success(t('admin.faq.saved')); setEditing(null); load();
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.details || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  const toggle = async (f) => { try { await api.patch(`/admin/faqs/${f._id}`, { active: !f.active }); load(); } catch (err) { toast.error(err.message); } };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next); // optimistic
    try { await api.post('/admin/faqs/reorder', { ids: next.map((f) => f._id) }); } catch (err) { toast.error(err.message); load(); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/faqs/${del._id}`); toast.success(t('admin.faq.deleted')); setDel(null); load(); }
    catch (err) { toast.error(err.message); setDel(null); } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><Button onClick={openNew}><Plus size={18} /> {t('admin.faq.add')}</Button></div>

      {error && !items ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center"><p className="text-danger">{t('admin.faq.loadError')}</p><Button variant="outline" className="mt-4" onClick={load}>{t('admin.dashboard.retry')}</Button></div>
      ) : !items ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-10 text-center"><HelpCircle className="mx-auto text-accent" size={32} /><p className="mt-3 font-semibold">{t('admin.faq.emptyTitle')}</p><p className="mt-1 text-muted">{t('admin.faq.emptyText')}</p></div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((f, i) => (
            <li key={f._id} className={`rounded-card border border-line bg-surface p-4 ${f.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-semibold">{localized(f.question, lang)}</p><p className="mt-1 line-clamp-2 text-sm text-muted">{localized(f.answer, lang)}</p>{f.category && <span className="mt-2 inline-block rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">{f.category}</span>}</div>
                <button onClick={() => toggle(f)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${f.active ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted'}`}>{f.active ? t('admin.faq.active') : t('admin.faq.hidden')}</button>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('admin.faq.up')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2 disabled:opacity-30"><ArrowUp size={18} /></button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={t('admin.faq.down')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2 disabled:opacity-30"><ArrowDown size={18} /></button>
                <button onClick={() => openEdit(f)} className="ms-auto flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium hover:bg-surface-2"><Pencil size={16} /> {t('admin.products.edit')}</button>
                <button onClick={() => setDel(f)} className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-danger hover:bg-surface-2"><Trash2 size={16} /> {t('admin.products.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} closeLabel={t('admin.common.close')} title={t(editing === 'new' ? 'admin.faq.add' : 'admin.products.edit')}>
        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <Input label={`${t('admin.faq.questionBn')} *`} value={form.qBn} error={errors['question.bn'] || errors.question} onChange={set('qBn')} />
          <Input label={t('admin.faq.questionEn')} value={form.qEn} onChange={set('qEn')} />
          <div>
            <label htmlFor="faq-a" className="mb-1.5 block text-sm font-medium">{t('admin.faq.answerBn')} *</label>
            <textarea id="faq-a" rows={4} value={form.aBn} onChange={set('aBn')} className={area} aria-invalid={!!(errors['answer.bn'] || errors.answer)} />
            {(errors['answer.bn'] || errors.answer) && <p className="mt-1 text-sm text-danger">{errors['answer.bn'] || errors.answer}</p>}
            <p className="mt-1 text-sm text-muted">{t('admin.faq.answerHint')}</p>
          </div>
          <div><label htmlFor="faq-ae" className="mb-1.5 block text-sm font-medium">{t('admin.faq.answerEn')}</label><textarea id="faq-ae" rows={3} value={form.aEn} onChange={set('aEn')} className={area} /></div>
          <Input label={t('admin.faq.category')} hint={t('admin.faq.categoryHint')} value={form.category} onChange={set('category')} maxLength={40} />
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-5 accent-[rgb(var(--primary))]" /> {t('admin.faq.showOnSite')}</label>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(null)}>{t('admin.admins.cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={busy || !form.qBn.trim() || !form.aBn.trim()}>{busy && <Loader2 className="animate-spin" size={18} />} {t('admin.admins.save')}</Button>
          </div>
        </form>
      </BottomSheet>

      <ConfirmSheet open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger title={t('admin.faq.deleteTitle')} text={del ? localized(del.question, lang) : ''} confirmLabel={t('admin.products.delete')} cancelLabel={t('admin.admins.cancel')} closeLabel={t('admin.common.close')} />
    </div>
  );
}
