import { Banknote, PackageSearch, Headset, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const ITEMS = [
  { key: 'cod', icon: Banknote },
  { key: 'track', icon: PackageSearch },
  { key: 'support', icon: Headset },
  { key: 'secure', icon: ShieldCheck },
];

export default function TrustBadges() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-6xl px-4">
      <ul className="-mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon }) => (
          <li key={key} className="relative rounded-card border border-line bg-surface p-4 shadow-soft">
            <Icon size={24} className="text-accent" />
            <p className="mt-2 font-semibold leading-snug">{t(`public.trust.${key}.title`)}</p>
            <p className="mt-1 text-sm text-muted">{t(`public.trust.${key}.text`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
