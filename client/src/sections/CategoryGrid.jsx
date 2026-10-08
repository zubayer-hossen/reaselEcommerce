import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FolderTree } from 'lucide-react';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { cld } from '../utils/cloudinary.js';
import { localized } from '../utils/format.js';
import SectionHeader from './SectionHeader.jsx';

export default function CategoryGrid() {
  const { t, lang } = useLanguage();
  const { data, loading, error, reload } = useApi(() => api.get('/categories'), []);
  const cats = (data?.categories || []).filter((c) => !c.parent);

  if (!loading && !error && cats.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <SectionHeader title={t('public.categories.title')} />
      {error ? (
        <div className="rounded-card border border-line p-6 text-center">
          <p className="text-muted">{t('public.states.loadError')}</p>
          <button onClick={reload} className="mt-3 min-h-11 rounded-control border border-line px-4 font-medium">{t('public.states.retry')}</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-card bg-surface-2" />)}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {cats.map((c, i) => (
            <motion.li key={c._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.05 }}>
              <Link to={`/shop?category=${c.slug}`} className="group relative block aspect-square overflow-hidden rounded-card bg-surface-2">
                {c.image?.url
                  ? <img src={cld(c.image.url, { w: 400, h: 400, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                  : <span className="grid size-full place-items-center bg-gradient-to-br from-surface-2 to-line text-5xl" aria-hidden="true">{c.icon || <FolderTree className="text-muted" size={36} />}</span>}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-center font-semibold text-white">{localized(c.name, lang)}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
