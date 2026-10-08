import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

// Home-page shortcut: type the order ID, finish with the phone digits on the tracking page.
export default function TrackBox() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const v = value.trim().toUpperCase();
    navigate(v ? `/track?order=${encodeURIComponent(v)}` : '/track');
  };
  return (
    <section className="mx-auto mt-14 max-w-6xl px-4">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-3 md:w-72 md:shrink-0">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><PackageSearch size={24} /></span>
          <div><h2 className="font-display text-xl font-bold">{t('public.trackBox.title')}</h2><p className="text-sm text-muted">{t('public.trackBox.text')}</p></div>
        </div>
        <div className="flex flex-1 gap-2">
          <input value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder={t('public.trackBox.placeholder')} aria-label={t('public.track.orderLabel')} autoCapitalize="characters" autoComplete="off"
            className="min-h-14 min-w-0 flex-1 rounded-control border border-line bg-bg px-4 text-base" />
          <button type="submit" className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-control bg-primary px-5 font-semibold text-primary-fg">{t('public.trackBox.button')} <ArrowRight size={18} /></button>
        </div>
      </form>
    </section>
  );
}
