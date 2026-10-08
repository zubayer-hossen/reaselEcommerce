import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HelpCircle } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useSeo } from '../../hooks/useSeo.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { localized } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import FaqAccordion from '../../components/faq/FaqAccordion.jsx';

export default function Faq() {
  const { t, lang } = useLanguage();
  const { siteName } = useSettings();
  const { data, loading, error, reload } = useApi(() => api.get('/faqs'), []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const faqs = data?.faqs || [];
  const cats = useMemo(() => [...new Set(faqs.map((f) => f.category).filter(Boolean))], [faqs]);

  const shown = faqs.filter((f) => {
    if (cat && f.category !== cat) return false;
    const term = q.trim().toLowerCase();
    return !term || `${localized(f.question, lang)} ${localized(f.answer, lang)}`.toLowerCase().includes(term);
  });

  // FAQ structured data (helps search engines show answers)
  useSeo({
    title: `${t('public.faq.title')} | ${siteName}`, description: t('public.faq.subtitle'),
    jsonLd: faqs.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 30).map((f) => ({ '@type': 'Question', name: localized(f.question, lang), acceptedAnswer: { '@type': 'Answer', text: localized(f.answer, lang) } })) } : undefined,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('public.faq.title')}</h1>
      <p className="mt-2 text-muted">{t('public.faq.subtitle')}</p>

      {faqs.length > 3 && (
        <div className="relative mt-6">
          <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('public.faq.search')} aria-label={t('public.faq.search')} className="min-h-12 w-full rounded-control border border-line bg-surface ps-10 pe-3" />
        </div>
      )}
      {cats.length > 0 && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {['', ...cats].map((c) => (
            <button key={c || 'all'} onClick={() => setCat(c)} aria-pressed={cat === c} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${cat === c ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>{c || t('public.faq.all')}</button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {error ? (
          <div className="rounded-card border border-line p-8 text-center"><p className="text-muted">{t('public.states.loadError')}</p><Button variant="outline" className="mt-3" onClick={reload}>{t('public.states.retry')}</Button></div>
        ) : loading ? (
          <div className="space-y-2" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-card bg-surface-2" />)}</div>
        ) : faqs.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-10 text-center"><HelpCircle className="mx-auto text-accent" size={32} /><p className="mt-3 text-muted">{t('public.faq.empty')}</p></div>
        ) : shown.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-8 text-center text-muted">{t('public.faq.noResults')}</p>
        ) : <FaqAccordion faqs={shown} />}
      </div>

      <div className="mt-8 rounded-card bg-surface-2 p-5 text-center">
        <p className="font-semibold">{t('public.faq.stillNeed')}</p>
        <Link to="/contact" className="mt-3 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-medium text-primary-fg">{t('public.faq.contactUs')}</Link>
      </div>
    </div>
  );
}
