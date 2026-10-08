import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { localized } from '../utils/format.js';

const cache = new Map();

function useAds(placement) {
  const { data, loading } = useApi(() => {
    if (cache.has(placement)) return Promise.resolve({ data: { ads: cache.get(placement) } });
    return api.get('/ads', { params: { placement } }).then((res) => {
      cache.set(placement, res.data?.ads || []);
      return res;
    });
  }, [placement]);
  return { ads: data?.ads || [], loading };
}

function track(id, type) {
  api.post(`/ads/${id}/${type}`).catch(() => {});
}

export default function AdSlot({ placement, className = '' }) {
  const { lang } = useLanguage();
  const { ads, loading } = useAds(placement);
  const seen = useRef(new Set());

  useEffect(() => {
    if (!ads.length) return undefined;
    if (!('IntersectionObserver' in window)) {
      ads.forEach((ad) => {
        if (!seen.current.has(ad._id)) { seen.current.add(ad._id); track(ad._id, 'impression'); }
      });
      return undefined;
    }
    const nodes = document.querySelectorAll(`[data-ad-placement="${placement}"]`);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('data-ad-id');
        if (id && !seen.current.has(id)) {
          seen.current.add(id);
          track(id, 'impression');
        }
      });
    }, { threshold: 0.5 });
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [ads, placement]);

  if (loading || !ads.length) return null;

  return (
    <section className={`mx-auto max-w-6xl px-4 ${className}`} aria-label="Advertisement">
      <div className="grid gap-4">
        {ads.map((ad) => {
          const title = localized(ad.title, lang);
          const body = localized(ad.body, lang);
          const rawLink = String(ad.link || '').trim();
          const link = /^(?:https?:\/\/|\/|#)/i.test(rawLink) ? rawLink : '';
          const external = /^https?:\/\//i.test(link);
          const content = (
            <div
              data-ad-placement={placement}
              data-ad-id={ad._id}
              className="group relative overflow-hidden rounded-card border border-line bg-surface shadow-sm"
            >
              {ad.imageUrl && (
                <picture>
                  {ad.mobileImageUrl && <source media="(max-width: 767px)" srcSet={ad.mobileImageUrl} />}
                  <img src={ad.imageUrl} alt={title} loading="lazy" className="block aspect-[3/1] w-full object-cover transition duration-500 group-hover:scale-[1.01]" />
                </picture>
              )}
              {(title || body) && (
                <div className={`${ad.imageUrl ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-14' : ''} p-5 md:p-6`}>
                  <div className={ad.imageUrl ? 'text-white' : ''}>
                    {title && <h2 className="font-display text-xl font-semibold md:text-2xl">{title}</h2>}
                    {body && <p className="mt-1 max-w-2xl text-sm opacity-85 md:text-base">{body}</p>}
                  </div>
                </div>
              )}
              {link && <span className="absolute end-4 top-4 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur" aria-hidden="true"><ExternalLink size={16} /></span>}
            </div>
          );
          return link ? (
            <a key={ad._id} href={link} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={() => track(ad._id, 'click')}>
              {content}
            </a>
          ) : <div key={ad._id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
