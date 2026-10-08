import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function FinalCta() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4">
      <div className="hero-bg rounded-card px-6 py-12 text-center text-white md:py-16">
        <h2 className="font-display text-3xl md:text-5xl">{t('public.cta.title')}</h2>
        <p className="mx-auto mt-3 max-w-md text-white/80">{t('public.cta.text')}</p>
        <Link to="/shop" className="mt-7 inline-flex min-h-14 items-center rounded-full bg-[#d6b05c] px-8 text-lg font-semibold text-[#1d1523] transition hover:brightness-110">
          {t('public.cta.button')}
        </Link>
      </div>
    </section>
  );
}
