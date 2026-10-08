import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, LogOut, Moon, Sun, Languages } from 'lucide-react';
import { ADMIN_NAV } from '../constants/adminNav.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import NotificationBell from './components/NotificationBell.jsx';

const linkBase = 'flex min-h-11 items-center gap-3 rounded-control px-3 text-[15px] font-medium transition';

function SideLink({ item, label, onClick }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin'}
      onClick={onClick}
      className={({ isActive }) => `${linkBase} ${isActive ? 'bg-primary text-primary-fg' : 'text-ink hover:bg-surface-2'}`}
    >
      <item.icon size={20} /> {label}
    </NavLink>
  );
}

export default function AdminLayout({ children }) {
  const { admin, can, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();

  const allowed = useMemo(() => ADMIN_NAV.filter((n) => can(n.perm)), [can]);
  const bottom = allowed.filter((n) => n.primary).slice(0, 4);
  const current = ADMIN_NAV.find((n) => (n.path === '/admin' ? pathname === '/admin' : pathname.startsWith(n.path)));

  const Account = (
    <div className="border-t border-line pt-3">
      <p className="truncate px-3 text-sm font-semibold">{admin.name}</p>
      <p className="truncate px-3 pb-2 text-xs text-muted">{t(`admin.roles.${admin.role}`)}</p>
      <button onClick={logout} className={`${linkBase} w-full text-danger hover:bg-surface-2`}>
        <LogOut size={20} /> {t('admin.common.logout')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-e border-line bg-surface p-4 md:flex">
        <p className="mb-3 px-3 text-2xl font-bold text-primary">{t('brand')}</p>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {allowed.map((n) => <SideLink key={n.key} item={n} label={t(`admin.nav.${n.key}`)} />)}
        </nav>
        {Account}
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 pb-3 backdrop-blur"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <h1 className="text-lg font-semibold">{current ? t(`admin.nav.${current.key}`) : t('brand')}</h1>
          <div className="flex gap-1">
            <NotificationBell />
            <button onClick={toggleLang} aria-label={t('common.language')} className="flex min-h-11 items-center gap-1 rounded-control px-3 text-sm font-medium hover:bg-surface-2">
              <Languages size={18} /> {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button onClick={toggleTheme} aria-label={t('common.theme')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label={t('admin.nav.menu')}
      >
        {bottom.map((n) => (
          <NavLink
            key={n.key}
            to={n.path}
            end={n.path === '/admin'}
            className={({ isActive }) => `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted'}`}
          >
            <n.icon size={22} /> {t(`admin.nav.${n.key}`)}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted">
          <Menu size={22} /> {t('admin.nav.more')}
        </button>
      </nav>

      {/* Mobile "More" drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              role="dialog" aria-modal="true" aria-label={t('admin.nav.menu')}
              className="absolute inset-y-0 start-0 flex w-[82%] max-w-xs flex-col gap-1 bg-surface p-4"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}
            >
              <div className="mb-2 flex items-center justify-between px-3">
                <p className="text-2xl font-bold text-primary">{t('brand')}</p>
                <button onClick={() => setDrawer(false)} aria-label={t('admin.common.close')} className="grid size-10 place-items-center rounded-control hover:bg-surface-2"><X size={20} /></button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
                {allowed.map((n) => <SideLink key={n.key} item={n} label={t(`admin.nav.${n.key}`)} onClick={() => setDrawer(false)} />)}
              </nav>
              {Account}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
