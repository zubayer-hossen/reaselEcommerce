import { Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// Honest placeholder for storefront pages built in the next step.
export default function PublicComingSoon() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Hammer className="mx-auto text-accent" size={36} />
      <h1 className="mt-4 text-xl font-semibold">{t('public.soon.title')}</h1>
      <p className="mt-2 text-muted">{t('public.soon.text')}</p>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-medium text-primary-fg">{t('nav.home')}</Link>
    </div>
  );
}
