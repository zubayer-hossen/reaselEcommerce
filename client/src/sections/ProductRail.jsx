import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import ProductScroller from '../components/ProductScroller.jsx';
import SectionHeader from './SectionHeader.jsx';

// A titled row of products. `params` are query params for GET /api/products.
// Renders nothing when there is nothing to show.
export default function ProductRail({ title, params, viewAllTo, onEmpty }) {
  const { t } = useLanguage();
  const { data, loading, error, reload } = useApi(() => api.get('/products', { params }), [JSON.stringify(params)]);
  const products = data?.products || [];

  if (!loading && !error && products.length === 0) return onEmpty ?? null;

  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <SectionHeader title={title} to={viewAllTo} />
      {error ? (
        <div className="rounded-card border border-line p-6 text-center">
          <p className="text-muted">{t('public.states.loadError')}</p>
          <button onClick={reload} className="mt-3 min-h-11 rounded-control border border-line px-4 font-medium">{t('public.states.retry')}</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-card bg-surface-2" />)}
        </div>
      ) : (
        <ProductScroller products={products} />
      )}
    </section>
  );
}
