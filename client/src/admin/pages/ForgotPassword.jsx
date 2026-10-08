import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('admin.forgot.title')} subtitle={sent ? undefined : t('admin.forgot.text')}>
      {sent ? (
        <p role="status" className="rounded-control bg-success/10 px-3 py-3 text-success">{t('admin.forgot.sent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.login.email')} type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy || !email} className="w-full">
            {busy && <Loader2 className="animate-spin" size={18} />} {t('admin.forgot.submit')}
          </Button>
        </form>
      )}
      <Link to="/admin/login" className="mt-5 block text-center text-sm font-medium text-primary">{t('admin.login.back')}</Link>
    </AuthShell>
  );
}
