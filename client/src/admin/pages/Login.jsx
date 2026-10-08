import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import AuthShell from './AuthShell.jsx';

export default function Login() {
  const { admin, loading, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && admin) return <Navigate to={location.state?.from || '/admin'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('admin.login.title')} subtitle={t('admin.login.subtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label={t('admin.login.email')} type="email" inputMode="email" autoComplete="username" required
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label={t('admin.login.password')} type={show ? 'text' : 'password'} autoComplete="current-password" required
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          right={
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t('admin.login.hide') : t('admin.login.show')} className="grid size-10 place-items-center text-muted">
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        {error && <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy || !form.email || !form.password} className="w-full">
          {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.login.submit')}
        </Button>
        <Link to="/admin/forgot-password" className="text-center text-sm font-medium text-primary">{t('admin.login.forgot')}</Link>
      </form>
    </AuthShell>
  );
}
