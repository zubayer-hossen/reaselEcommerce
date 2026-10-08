import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, Package } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { cld } from '../../utils/cloudinary.js';
import { localized } from '../../utils/format.js';

// Full-screen on phones, top sheet on larger screens. Suggestions come from GET /api/products/suggest.
export default function SearchOverlay({ open, onClose }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null); // null = not searched yet

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setResults(null);
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(id); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults(null); return undefined; }
    let alive = true;
    const id = setTimeout(() => {
      api.get('/products/suggest', { params: { q: term } })
        .then((r) => alive && setResults(r.data.suggestions))
        .catch(() => alive && setResults([]));
    }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [q]);

  const go = (path) => { onClose(); navigate(path); };
  const submit = (e) => { e.preventDefault(); if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label={t('public.search')}
          className="fixed inset-0 z-[55] bg-bg md:bg-black/50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="mx-auto flex h-full max-w-2xl flex-col bg-bg md:mt-16 md:h-auto md:max-h-[70vh] md:rounded-card md:shadow-soft">
            <form onSubmit={submit} className="flex items-center gap-2 border-b border-line p-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
              <Search size={20} className="ms-2 shrink-0 text-muted" />
              <input
                ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={t('public.searchPlaceholder')} aria-label={t('public.search')}
                className="min-h-12 flex-1 bg-transparent text-base outline-none"
              />
              <button type="button" onClick={onClose} aria-label={t('public.close')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2"><X size={22} /></button>
            </form>

            <div className="flex-1 overflow-y-auto p-3">
              {results === null && <p className="p-4 text-center text-muted">{t('public.searchHint')}</p>}
              {results && results.length === 0 && <p className="p-4 text-center text-muted">{t('public.searchEmpty')}</p>}
              {results && results.length > 0 && (
                <ul>
                  {results.map((s) => (
                    <li key={s._id}>
                      <button onClick={() => go(`/product/${s.slug}`)} className="flex min-h-14 w-full items-center gap-3 rounded-control p-2 text-start hover:bg-surface-2">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">
                          {s.image?.url ? <img src={cld(s.image.url, { w: 96, h: 96, crop: 'fill' })} alt="" className="size-full object-cover" /> : <Package size={20} className="text-muted" />}
                        </span>
                        <span className="truncate font-medium">{localized(s.name, lang)}</span>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button onClick={submit} className="mt-1 min-h-12 w-full rounded-control p-2 text-center font-medium text-primary hover:bg-surface-2">
                      {t('public.viewAllResults')}
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
