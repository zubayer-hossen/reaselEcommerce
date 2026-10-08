import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, Package, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { cld } from '../../utils/cloudinary.js';
import { formatNumber } from '../../utils/format.js';

// Swipeable (scroll-snap) gallery + thumbnails + hover zoom (desktop) + fullscreen lightbox.
// jump = { index, n } → scroll to an image from outside (e.g. when a color variant is chosen).
export default function ProductGallery({ images, name, jump }) {
  const { t, lang } = useLanguage();
  const scroller = useRef(null);
  const [index, setIndex] = useState(0);
  const [lb, setLb] = useState(null); // lightbox index | null
  const count = images.length;

  const goTo = useCallback((i) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => { if (jump) goTo(jump.index); }, [jump, goTo]);

  // lightbox keyboard
  useEffect(() => {
    if (lb === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') setLb((i) => Math.min(count - 1, i + 1));
      if (e.key === 'ArrowLeft') setLb((i) => Math.max(0, i - 1));
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lb === null, count]);

  const closeLb = () => { if (lb !== null) goTo(lb); setLb(null); };

  const zoomMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const img = e.currentTarget.querySelector('img');
    if (img) img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  };

  if (count === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-card bg-gradient-to-br from-surface-2 to-line text-muted" role="img" aria-label={name}>
        <Package size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div ref={scroller} onScroll={onScroll} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-card" tabIndex={0} aria-label={name}>
          {images.map((img, i) => (
            <button
              key={img.publicId || img.url} type="button" onClick={() => setLb(i)} onMouseMove={zoomMove}
              aria-label={`${t('public.product.openImage')} ${formatNumber(i + 1, lang)}`}
              className="group relative aspect-[4/5] min-w-full snap-center overflow-hidden bg-surface-2 md:cursor-zoom-in"
            >
              <img
                src={cld(img.url, { w: 900, h: 1125, crop: 'fill' })} alt={img.alt || img.label || name}
                loading={i === 0 ? 'eager' : 'lazy'} draggable={false}
                className="size-full object-cover transition-transform duration-300 md:group-hover:scale-[1.7]"
              />
            </button>
          ))}
        </div>

        {count > 1 && (
          <>
            <span className="pointer-events-none absolute end-3 top-3 rounded-full bg-black/55 px-3 py-1 text-sm font-medium text-white">{formatNumber(index + 1, lang)}/{formatNumber(count, lang)}</span>
            <button onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0} aria-label={t('public.product.prev')} className="absolute start-2 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 shadow disabled:opacity-30 md:grid"><ChevronLeft size={22} /></button>
            <button onClick={() => goTo(Math.min(count - 1, index + 1))} disabled={index === count - 1} aria-label={t('public.product.next')} className="absolute end-2 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 shadow disabled:opacity-30 md:grid"><ChevronRight size={22} /></button>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3 end-3 hidden rounded-full bg-black/55 p-2 text-white md:block"><Maximize2 size={16} /></span>
      </div>

      {count > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.publicId || img.url} className="shrink-0">
              <button onClick={() => goTo(i)} aria-label={`${t('public.product.openImage')} ${formatNumber(i + 1, lang)}`} aria-current={i === index}
                className={`block size-16 overflow-hidden rounded-control border-2 transition ${i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <img src={cld(img.url, { w: 140, h: 140, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {lb !== null && (
          <motion.div
            role="dialog" aria-modal="true" aria-label={name}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeLb}
          >
            <img
              src={cld(images[lb].url, { w: 1600 })} alt={images[lb].alt || name} onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain" style={{ touchAction: 'pinch-zoom' }}
            />
            <button onClick={closeLb} aria-label={t('public.close')} className="absolute end-3 grid size-12 place-items-center rounded-full bg-white/15 text-white" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}><X size={24} /></button>
            <span className="absolute start-3 rounded-full bg-white/15 px-3 py-1 text-sm text-white" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>{formatNumber(lb + 1, lang)}/{formatNumber(count, lang)}</span>
            {lb > 0 && <button onClick={(e) => { e.stopPropagation(); setLb(lb - 1); }} aria-label={t('public.product.prev')} className="absolute start-2 grid size-12 place-items-center rounded-full bg-white/15 text-white"><ChevronLeft size={26} /></button>}
            {lb < count - 1 && <button onClick={(e) => { e.stopPropagation(); setLb(lb + 1); }} aria-label={t('public.product.next')} className="absolute end-2 grid size-12 place-items-center rounded-full bg-white/15 text-white"><ChevronRight size={26} /></button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
