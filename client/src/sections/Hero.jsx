import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';

// Interim hero: typographic, uses the site name + default copy. In the CMS phase it becomes a banner slider
// (images/video, CTA, schedule) driven by the admin panel.
export default function Hero() {
  const { t } = useLanguage();
  const { siteName } = useSettings();
  const reduce = useReducedMotion();
  const rise = (delay) => (reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } });

  return (
    <section className="hero-bg relative overflow-hidden text-white">
      <span aria-hidden="true" className="pointer-events-none absolute -end-6 -top-10 select-none font-display text-[18rem] leading-none text-white/[0.05] md:text-[26rem]">স</span>
      <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 py-20 md:min-h-[70vh]">
        <motion.p {...rise(0)} className="flex items-center gap-3 text-sm font-medium tracking-wide text-[#e5c97a] md:text-base">
          <span className="h-px w-10 bg-[#e5c97a]" /> {t('public.hero.kicker')}
        </motion.p>
        <motion.h1 {...rise(0.12)} className="mt-5 font-display text-6xl leading-[1.05] md:text-8xl">{siteName}</motion.h1>
        <motion.p {...rise(0.24)} className="mt-5 max-w-md text-lg text-white/80">{t('public.hero.subtitle')}</motion.p>
        <motion.div {...rise(0.36)} className="mt-9">
          <Link to="/shop" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#d6b05c] px-8 text-lg font-semibold text-[#1d1523] transition hover:brightness-110">
            {t('public.hero.cta')} <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
