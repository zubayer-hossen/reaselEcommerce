import { useParams } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { ADMIN_NAV } from '../../constants/adminNav.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// Honest placeholder for sections that are built in later phases.
export default function ComingSoon() {
  const { section } = useParams();
  const { can } = useAuth();
  const { t } = useLanguage();
  const item = ADMIN_NAV.find((n) => n.key === section);

  if (!item) return <p className="text-muted">{t('admin.common.unknown')}</p>;
  if (!can(item.perm)) return <p className="rounded-card border border-line bg-surface p-6 text-muted">{t('admin.common.forbidden')}</p>;

  return (
    <div className="rounded-card border border-dashed border-line p-10 text-center">
      <Hammer className="mx-auto text-accent" size={32} />
      <p className="mt-3 font-semibold">{t('admin.common.soonTitle')}</p>
      <p className="mt-1 text-muted">{t(`admin.nav.${item.key}`)} — {t('admin.common.soonText')}</p>
    </div>
  );
}
