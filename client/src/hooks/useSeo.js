import { useEffect } from 'react';

// Per-page <title>, meta description, Open Graph, canonical and JSON-LD structured data.
// Created tags are removed on unmount so pages never leak SEO tags into each other.
function upsert(selector, create, set) {
  let el = document.head.querySelector(selector);
  let created = false;
  if (!el) { el = create(); document.head.appendChild(el); created = true; }
  set(el);
  return created ? el : null;
}

export function useSeo({ title, description, image, jsonLd }) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    if (!title) return undefined;
    const prevTitle = document.title;
    document.title = title;
    const made = [];
    const meta = (attr, key, content) => {
      if (!content) return;
      const el = upsert(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; }, (m) => m.setAttribute('content', content));
      if (el) made.push(el);
    };
    meta('name', 'description', description);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:image', image);
    meta('property', 'og:type', 'website');
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');

    const canon = upsert('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }, (l) => { l.href = window.location.origin + window.location.pathname; });
    if (canon) made.push(canon);

    if (ld) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = ld;
      document.head.appendChild(s);
      made.push(s);
    }
    return () => { document.title = prevTitle; made.forEach((el) => el.remove()); };
  }, [title, description, image, ld]);
}
