import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { uploadImage } from '../../utils/uploadImage.js';
import { cld } from '../../utils/cloudinary.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const MAX_IMAGES = 12;

// images = [{ url, publicId, alt?, label? }]. First image is the main one; others are the "sample" gallery.
export default function GalleryEditor({ images, onChange }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(0); // number of files still uploading
  const [error, setError] = useState('');

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])].slice(0, MAX_IMAGES - images.length);
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setBusy(files.length);
    const added = [];
    for (const file of files) {
      try {
        added.push(await uploadImage(file, 'products'));
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) onChange([...images, ...added]);
  };

  const move = (i, dir) => {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const makeMain = (i) => onChange([images[i], ...images.filter((_, k) => k !== i)]);
  const remove = (i) => onChange(images.filter((_, k) => k !== i));
  const setLabel = (i, label) => onChange(images.map((img, k) => (k === i ? { ...img, label } : img)));

  return (
    <div>
      <p className="mb-3 text-sm text-muted">{t('admin.products.galleryHint')}</p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.publicId || img.url} className="rounded-control border border-line bg-surface p-2">
            <div className="relative aspect-square overflow-hidden rounded-control bg-surface-2">
              <img src={cld(img.url, { w: 360, h: 360, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover" />
              {i === 0 && <span className="absolute start-1 top-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-ink">{t('admin.products.main')}</span>}
            </div>
            <input
              value={img.label || ''} onChange={(e) => setLabel(i, e.target.value)} maxLength={80}
              placeholder={t('admin.products.caption')} aria-label={t('admin.products.caption')}
              className="mt-2 min-h-10 w-full rounded-control border border-line bg-surface px-2 text-sm"
            />
            <div className="mt-1 flex items-center justify-between">
              <div className="flex">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('admin.products.moveBack')} className="grid size-10 place-items-center rounded-control disabled:opacity-30 hover:bg-surface-2"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={t('admin.products.moveForward')} className="grid size-10 place-items-center rounded-control disabled:opacity-30 hover:bg-surface-2"><ChevronRight size={18} /></button>
                {i !== 0 && <button type="button" onClick={() => makeMain(i)} aria-label={t('admin.products.makeMain')} className="grid size-10 place-items-center rounded-control hover:bg-surface-2"><Star size={18} /></button>}
              </div>
              <button type="button" onClick={() => remove(i)} aria-label={t('admin.products.removeImage')} className="grid size-10 place-items-center rounded-control text-danger hover:bg-surface-2"><Trash2 size={18} /></button>
            </div>
          </li>
        ))}
        {images.length < MAX_IMAGES && (
          <li>
            <button
              type="button" onClick={() => inputRef.current?.click()} disabled={busy > 0}
              className="grid aspect-square w-full place-items-center rounded-control border border-dashed border-line bg-surface-2 text-muted"
            >
              <span className="flex flex-col items-center gap-1 text-sm">
                {busy > 0 ? <Loader2 className="animate-spin" size={24} /> : <ImagePlus size={24} />}
                {busy > 0 ? `${t('admin.upload.uploading')} (${busy})` : t('admin.products.addImages')}
              </span>
            </button>
          </li>
        )}
      </ul>
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={onFiles} className="sr-only" aria-label={t('admin.products.addImages')} />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
