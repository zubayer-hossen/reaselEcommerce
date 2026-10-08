import { useEffect, useRef, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { localized } from '../utils/format.js';

const cache = new Map();

function usePopupAd() {
  const { data, loading } = useApi(() => {
    if (cache.has('popup')) return Promise.resolve({ data: { ads: cache.get('popup') } });
    return api.get('/ads', { params: { placement: 'popup', limit: 1 } }).then((res) => {
      const ads = res.data?.ads || [];
      cache.set('popup', ads);
      return res;
    });
  }, []);
  return { ad: data?.ads?.[0] || null, loading };
}

function track(id, type) {
  api.post(`/ads/${id}/${type}`).catch(() => {});
}

export default function AdPopup() {
  const { lang, t } = useLanguage();
  const { ad, loading } = usePopupAd();
  const [open, setOpen] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    if (loading || !ad || seen.current) return;
    const key = `shajghor:ad-popup:${ad._id}`;
    if (sessionStorage.getItem(key) === '1') return;
    seen.current = true;
    const timer = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(key, '1');
      track(ad._id, 'impression');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [ad, loading]);

  if (!open || !ad) return null;

  const title = localized(ad.title, lang);
  const body = localized(ad.body, lang);
  const rawLink = String(ad.link || '').trim();
  const link = /^(?:https?:\/\/|\/|#)/i.test(rawLink) ? rawLink : '';
  const external = /^https?:\/\//i.test(link);
  const close = () => setOpen(false);
  const activate = () => { if (link) track(ad._id, 'click'); };

  const content = (
    <div className="relative overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-black/10">
      {ad.imageUrl && (
        <picture>
          {ad.mobileImageUrl && <source media="(max-width: 767px)" srcSet={ad.mobileImageUrl} />}
          <img src={ad.imageUrl} alt={title} className="block max-h-[70vh] w-full object-cover" />
        </picture>
      )}
      {(title || body) && (
        <div className="p-5 md:p-6">
          {title && <h2 className="font-display text-xl font-semibold md:text-2xl">{title}</h2>}
          {body && <p className="mt-2 text-sm text-muted md:text-base">{body}</p>}
          {link && <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">{t('public.viewAll')} <ExternalLink size={15} /></span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title || 'Advertisement'} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <button type="button" onClick={close} aria-label={t('public.close')} className="absolute end-4 top-4 grid size-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white">
        <X size={21} />
      </button>
      {link ? <a href={link} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={activate} className="block w-full max-w-2xl">{content}</a> : <div className="w-full max-w-2xl">{content}</div>}
    </div>
  );
}
