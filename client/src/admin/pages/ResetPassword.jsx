import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import AuthShell from './AuthShell.jsx';

export default function ResetPassword() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err.details?.newPassword?.[0] || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('admin.reset.title')}>
      {!token ? (
        <p role="alert" className="text-danger">{t('admin.reset.missing')}</p>
      ) : done ? (
        <p role="status" className="rounded-control bg-success/10 px-3 py-3 text-success">{t('admin.reset.done')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label={t('admin.reset.newPassword')} hint={t('admin.reset.hint')} type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} error={error}
          />
          <Button type="submit" disabled={busy || password.length < 8} className="w-full">
            {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.reset.submit')}
          </Button>
        </form>
      )}
      <Link to="/admin/login" className="mt-5 block text-center text-sm font-medium text-primary">{t('admin.login.back')}</Link>
    </AuthShell>
  );
}
