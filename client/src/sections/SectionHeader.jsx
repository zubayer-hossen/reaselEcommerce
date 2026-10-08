import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function SectionHeader({ title, to }) {
  const { t } = useLanguage();
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-bold md:text-4xl">{title}</h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
      </div>
      {to && (
        <Link to={to} className="flex min-h-11 items-center gap-1.5 font-medium text-primary">
          {t('public.viewAll')} <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
