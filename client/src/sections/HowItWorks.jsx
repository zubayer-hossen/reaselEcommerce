import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function HowItWorks() {
  const { t, lang } = useLanguage();
  const n = (i) => (lang === 'bn' ? '১২৩৪'[i] : String(i + 1));
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4">
      <h2 className="font-display text-3xl font-bold md:text-4xl">{t('public.how.title')}</h2>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((s, i) => (
          <li key={s} className="rounded-card border border-line bg-surface p-5">
            <span className="grid size-10 place-items-center rounded-full bg-primary font-display text-lg text-primary-fg">{n(i)}</span>
            <p className="mt-3 font-semibold">{t(`public.how.s${s}t`)}</p>
            <p className="mt-1 text-muted">{t(`public.how.s${s}d`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
