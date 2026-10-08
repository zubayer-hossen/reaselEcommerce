import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Hero from '../../sections/Hero.jsx';
import TrustBadges from '../../sections/TrustBadges.jsx';
import TrackBox from '../../sections/TrackBox.jsx';
import CategoryGrid from '../../sections/CategoryGrid.jsx';
import ProductRail from '../../sections/ProductRail.jsx';
import HowItWorks from '../../sections/HowItWorks.jsx';
import FaqSection from '../../sections/FaqSection.jsx';
import FinalCta from '../../sections/FinalCta.jsx';
import AdSlot from '../../components/AdSlot.jsx';
import AdPopup from '../../components/AdPopup.jsx';

// Section order here is fixed for now; the CMS phase makes it admin-reorderable (HomepageSection).
export default function Home() {
  const { t } = useLanguage();
  return (
    <>
      <AdPopup />
      <AdSlot placement="home_hero" className="mt-4 md:mt-6" />
      <Hero />
      <TrustBadges />
      <AdSlot placement="home_banner" className="mt-10" />
      <TrackBox />
      <CategoryGrid />
      <ProductRail title={t('public.featured.title')} params={{ featured: 'true', limit: 8 }} viewAllTo="/shop?featured=true" />
      <ProductRail title={t('public.newArrivals.title')} params={{ isNew: 'true', limit: 8 }} viewAllTo="/shop?isNew=true" />
      <HowItWorks />
      <FaqSection />
      <FinalCta />
    </>
  );
}
