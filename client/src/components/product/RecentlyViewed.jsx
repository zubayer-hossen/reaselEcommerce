import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import ProductScroller from '../ProductScroller.jsx';
import SectionHeader from '../../sections/SectionHeader.jsx';

const KEY = 'recent:v1';
const readRecent = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };

// Remember a viewed product (most recent first, max 12).
export function rememberProduct(slug) {
  try { localStorage.setItem(KEY, JSON.stringify([slug, ...readRecent().filter((s) => s !== slug)].slice(0, 12))); } catch { /* ignore */ }
}

export default function RecentlyViewed({ currentSlug }) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const slugs = readRecent().filter((s) => s !== currentSlug).slice(0, 8);
    if (!slugs.length) { setItems([]); return undefined; }
    let alive = true;
    api.get('/products', { params: { slugs: slugs.join(','), limit: 12 } })
      .then((r) => {
        if (!alive) return;
        const bySlug = Object.fromEntries(r.data.products.map((p) => [p.slug, p]));
        setItems(slugs.map((s) => bySlug[s]).filter(Boolean)); // keep "most recent first" order
      })
      .catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [currentSlug]);

  if (!items.length) return null;
  return (
    <section className="mt-14">
      <SectionHeader title={t('public.product.recent')} />
      <ProductScroller products={items} />
    </section>
  );
}
