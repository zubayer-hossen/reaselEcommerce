import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import FaqAccordion from '../components/faq/FaqAccordion.jsx';
import SectionHeader from './SectionHeader.jsx';

// Home-page FAQ: first few questions. Hidden when there are none (or the API is down) — never a broken block.
export default function FaqSection() {
  const { t } = useLanguage();
  const { data } = useApi(() => api.get('/faqs'), []);
  const faqs = (data?.faqs || []).slice(0, 5);
  if (!faqs.length) return null;
  return (
    <section className="mx-auto mt-20 max-w-3xl px-4">
      <SectionHeader title={t('public.faq.title')} to="/faq" />
      <FaqAccordion faqs={faqs} />
    </section>
  );
}
