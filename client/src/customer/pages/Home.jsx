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
import { useHomepage } from '../../contexts/HomepageContext.jsx';

export default function Home() {
  const { t } = useLanguage();
  const { sections } = useHomepage();
  const order = sections?.length ? sections : [
    { key:'hero',enabled:true },{ key:'trust',enabled:true },{ key:'track',enabled:true },{ key:'categories',enabled:true },
    { key:'featured',enabled:true },{ key:'newArrivals',enabled:true },{ key:'howItWorks',enabled:true },{ key:'faq',enabled:true },{ key:'finalCta',enabled:true },
  ];
  const render = (key) => {
    switch(key) {
      case 'hero': return <><AdSlot placement="home_hero" className="mt-4 md:mt-6" /><Hero /></>;
      case 'trust': return <TrustBadges />;
      case 'track': return <TrackBox />;
      case 'categories': return <CategoryGrid />;
      case 'featured': return <ProductRail title={t('public.featured.title')} params={{ featured:'true', limit:8 }} viewAllTo="/shop?featured=true" />;
      case 'newArrivals': return <ProductRail title={t('public.newArrivals.title')} params={{ isNew:'true', limit:8 }} viewAllTo="/shop?isNew=true" />;
      case 'howItWorks': return <HowItWorks />;
      case 'faq': return <><AdSlot placement="home_banner" className="mt-10" /><FaqSection /></>;
      case 'finalCta': return <FinalCta />;
      default: return null;
    }
  };
  return <><AdPopup />{order.filter(x=>x.enabled).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)).map(x=><div key={x.key}>{render(x.key)}</div>)}</>;
}
