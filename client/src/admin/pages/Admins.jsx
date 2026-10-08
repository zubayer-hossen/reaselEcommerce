import { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import BottomSheet from '../../components/ui/BottomSheet.jsx';

const ASSIGNABLE = ['admin', 'super_admin', 'order_manager', 'product_manager', 'support_manager', 'marketing_manager', 'content_manager'];
const empty = { name: '', email: '', password: '', role: 'admin' };

export default function Admins() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [admins, setAdmins] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res.data.admins);
    } catch (e) { toast.error(e.message); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    try {
      await api.patch(`/admin/admins/${id}`, body);
      toast.success(t('admin.admins.updated'));
      load();
    } catch (e) { toast.error(e.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api.post('/admin/admins', form);
      toast.success(t('admin.admins.created'));
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.details || {}).map(([k, v]) => [k, v[0]])));
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={18} /> {t('admin.admins.add')}</Button>
      </div>

      {!admins ? (
        <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {admins.map((a) => (
            <li key={a.id} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="truncate text-sm text-muted">{a.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${a.isActive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                  {a.isActive ? t('admin.admins.active') : t('admin.admins.inactive')}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {t('admin.admins.lastLogin')}: {a.lastLoginAt ? formatDateTime(a.lastLoginAt, lang) : t('admin.admins.never')}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {a.role === 'owner' ? (
                  <span className="rounded-control bg-accent/20 px-3 py-2 text-sm font-medium">{t('admin.roles.owner')}</span>
                ) : (
                  <>
                    <select
                      aria-label={t('admin.admins.role')} value={a.role}
                      onChange={(e) => patch(a.id, { role: e.target.value })}
                      className="min-h-11 flex-1 rounded-control border border-line bg-surface px-3 text-sm"
                    >
                      {ASSIGNABLE.map((r) => <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>)}
                    </select>
                    <Button variant="outline" onClick={() => patch(a.id, { isActive: !a.isActive })}>
                      {a.isActive ? t('admin.admins.disable') : t('admin.admins.enable')}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title={t('admin.admins.add')} closeLabel={t('admin.common.close')}>
        <form onSubmit={create} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.admins.name')} required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label={t('admin.admins.email')} type="email" inputMode="email" required value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t('admin.admins.password')} hint={t('admin.reset.hint')} type="password" autoComplete="new-password" required value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium">{t('admin.admins.role')}</label>
            <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="min-h-12 w-full rounded-control border border-line bg-surface px-3">
              {ASSIGNABLE.map((r) => <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>{t('admin.admins.cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={busy}>
              {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.admins.save')}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
