import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import AdminLayout from './AdminLayout.jsx';

export function ProtectedRoute() {
  const { admin, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted" role="status">
        <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> {t('admin.common.loading')}</span>
      </div>
    );
  }
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export function RequirePermission({ perm, children }) {
  const { can } = useAuth();
  const { t } = useLanguage();
  if (!can(perm)) return <p className="rounded-card border border-line bg-surface p-6 text-muted">{t('admin.common.forbidden')}</p>;
  return children;
}
