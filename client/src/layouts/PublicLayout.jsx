import { Outlet } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext.jsx';
import { CartProvider } from '../contexts/CartContext.jsx';
import { HomepageProvider } from '../contexts/HomepageContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { localized } from '../utils/format.js';
import AnnouncementBar from './parts/AnnouncementBar.jsx';
import Navbar from './parts/Navbar.jsx';
import Footer from './parts/Footer.jsx';
import BackToTop from './parts/BackToTop.jsx';
import SupportFab from './parts/SupportFab.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';

function Maintenance() {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Wrench className="mx-auto text-accent" size={40} />
        <p className="mt-4 font-display text-3xl font-bold text-primary">{siteName}</p>
        <h1 className="mt-4 text-xl font-semibold">{localized(settings?.maintenance?.message, lang) || t('public.maintenance.title')}</h1>
        <p className="mt-2 text-muted">{t('public.maintenance.text')}</p>
      </div>
    </main>
  );
}

function Shell() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  // Maintenance mode only affects the storefront; /admin lives outside this layout and stays reachable.
  if (settings?.maintenance?.enabled) return <Maintenance />;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-[70] rounded-control bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:start-3 focus:top-3">{t('public.skip')}</a>
      <AnnouncementBar />
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <BackToTop />
      <SupportFab />
      <CartDrawer />
    </div>
  );
}

export default function PublicLayout() {
  return (
    <SettingsProvider>
      <HomepageProvider>
        <CartProvider>
          <Shell />
        </CartProvider>
      </HomepageProvider>
    </SettingsProvider>
  );
}
