import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage } from '../../utils/uploadImage.js';
import { cld } from '../../utils/cloudinary.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// value = { url, publicId } | null
export default function ImageUploader({ value, onChange, folder, label }) {
  const { t } = useLanguage();
  const id = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={value ? t('admin.upload.change') : t('admin.upload.choose')}
          className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-control border border-dashed border-line bg-surface-2 text-muted"
        >
          {value?.url ? <img src={cld(value.url, { w: 200, h: 200, crop: 'fill' })} alt="" className="size-full object-cover" /> : <ImagePlus size={26} />}
          {busy && <span className="absolute inset-0 grid place-items-center bg-bg/70"><Loader2 className="animate-spin" size={22} /></span>}
        </button>
        <div className="flex flex-col items-start gap-2">
          <label htmlFor={id} className="sr-only">{label || t('admin.upload.choose')}</label>
          <input id={id} ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={onFile} className="sr-only" />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="min-h-11 rounded-control border border-line px-4 text-sm font-medium hover:bg-surface-2">
            {busy ? t('admin.upload.uploading') : value ? t('admin.upload.change') : t('admin.upload.choose')}
          </button>
          {value && !busy && (
            <button type="button" onClick={() => onChange(null)} className="flex min-h-11 items-center gap-1.5 px-1 text-sm text-danger">
              <Trash2 size={16} /> {t('admin.upload.remove')}
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
