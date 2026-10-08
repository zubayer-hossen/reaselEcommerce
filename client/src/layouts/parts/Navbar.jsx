import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, ShoppingBag, Menu, X, Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { formatNumber } from '../../utils/format.js';
import SearchOverlay from './SearchOverlay.jsx';

// Only routes that exist are linked.
const LINKS = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/shop', key: 'nav.products' },
  { to: '/track', key: 'nav.track' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/contact', key: 'nav.contact' },
];

const iconBtn = 'relative grid size-11 place-items-center rounded-control transition hover:bg-surface-2';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { settings, siteName } = useSettings();
  const { count, openDrawer } = useCart();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenu(false); }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition ${scrolled ? 'border-line bg-bg/80 backdrop-blur-md' : 'border-transparent bg-bg'}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <Link to="/" className="flex min-h-11 items-center gap-2" aria-label={siteName}>
            {settings?.logo && <img src={settings.logo} alt="" className="h-9 w-auto" />}
            <span className="font-display text-2xl font-bold text-primary">{siteName}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label={t('public.menu')}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `flex min-h-11 items-center rounded-control px-4 font-medium transition ${isActive ? 'text-primary' : 'hover:bg-surface-2'}`}>
                {t(l.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center">
            <button onClick={() => setSearch(true)} aria-label={t('public.search')} className={iconBtn}><Search size={21} /></button>
            <button onClick={toggleLang} aria-label={t('common.language')} className={`${iconBtn} hidden md:grid`}><Languages size={20} /></button>
            <button onClick={toggleTheme} aria-label={t('common.theme')} className={`${iconBtn} hidden md:grid`}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={openDrawer} aria-label={`${t('nav.cart')}${count ? ` (${count})` : ''}`} className={iconBtn}>
              <ShoppingBag size={21} />
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                  className="absolute end-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-ink">
                  {formatNumber(count, lang)}
                </motion.span>
              )}
            </button>
            <button onClick={() => setMenu(true)} aria-label={t('public.menu')} className={`${iconBtn} md:hidden`}><Menu size={22} /></button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menu && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.div
              role="dialog" aria-modal="true" aria-label={t('public.menu')}
              className="absolute inset-y-0 end-0 flex w-[80%] max-w-xs flex-col bg-surface p-4"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.22 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-primary">{siteName}</span>
                <button onClick={() => setMenu(false)} aria-label={t('public.close')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2"><X size={22} /></button>
              </div>
              <nav className="flex flex-1 flex-col gap-1">
                {LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.end}
                    className={({ isActive }) => `flex min-h-12 items-center rounded-control px-3 text-lg font-medium ${isActive ? 'bg-primary text-primary-fg' : 'hover:bg-surface-2'}`}>
                    {t(l.key)}
                  </NavLink>
                ))}
              </nav>
              <div className="flex gap-2 border-t border-line pt-3">
                <button onClick={toggleLang} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control border border-line font-medium"><Languages size={18} /> {lang === 'bn' ? 'English' : 'বাংলা'}</button>
                <button onClick={toggleTheme} aria-label={t('common.theme')} className="grid size-12 place-items-center rounded-control border border-line">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
