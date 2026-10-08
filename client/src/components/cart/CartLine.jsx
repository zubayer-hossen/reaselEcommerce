import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { cld } from '../../utils/cloudinary.js';
import { formatMoney, formatNumber, localized } from '../../utils/format.js';

// One cart row. `line` comes from mergeLines().
export default function CartLine({ line, onQty, onRemove, onNavigate, compact = false }) {
  const { t, lang } = useLanguage();
  const name = localized(line.name, lang);
  const issue = line.issue;
  const maxQty = line.stock > 0 ? line.stock : 99;
  const size = compact ? 'size-16' : 'size-24';

  const issueText = !issue ? null
    : issue.code === 'insufficient_stock' ? `${t('public.cart.issueFew')}: ${formatNumber(issue.available, lang)}`
    : issue.code === 'out_of_stock' ? t('public.cart.issueOut')
    : t('public.cart.issueGone');

  return (
    <li className="flex gap-3 py-4">
      <Link to={`/product/${line.slug}`} onClick={onNavigate} className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2`} aria-label={name}>
        {line.image ? <img src={cld(line.image, { w: 200, h: 200, crop: 'fill' })} alt="" loading="lazy" className="size-full object-cover" /> : <Package className="text-muted" size={24} />}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${line.slug}`} onClick={onNavigate} className="line-clamp-2 font-medium leading-snug">{name}</Link>
          <button onClick={onRemove} aria-label={`${t('public.cart.remove')}: ${name}`} className="-me-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2 hover:text-danger"><Trash2 size={18} /></button>
        </div>
        {(line.color || line.size) && <p className="text-sm text-muted">{[line.color, line.size].filter(Boolean).join(' · ')}</p>}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-control border border-line">
            <button onClick={() => onQty(line.qty - 1)} disabled={line.qty <= 1} aria-label={t('public.product.decrease')} className="grid size-10 place-items-center disabled:opacity-40"><Minus size={16} /></button>
            <span className="w-9 text-center font-semibold" aria-live="polite">{formatNumber(line.qty, lang)}</span>
            <button onClick={() => onQty(line.qty + 1)} disabled={line.qty >= maxQty} aria-label={t('public.product.increase')} className="grid size-10 place-items-center disabled:opacity-40"><Plus size={16} /></button>
          </div>
          <div className="text-end">
            <p className="font-semibold text-primary">{formatMoney(line.lineTotal, lang)}</p>
            {line.qty > 1 && <p className="text-xs text-muted">{formatMoney(line.unitPrice, lang)} × {formatNumber(line.qty, lang)}</p>}
          </div>
        </div>

        {issueText && (
          <p role="alert" className="mt-2 flex flex-wrap items-center gap-2 rounded-control bg-danger/10 px-3 py-2 text-sm text-danger">
            {issueText}
            {issue.code === 'insufficient_stock'
              ? <button onClick={() => onQty(issue.available)} className="font-semibold underline">{t('public.cart.fixMax')}</button>
              : <button onClick={onRemove} className="font-semibold underline">{t('public.cart.remove')}</button>}
          </p>
        )}
      </div>
    </li>
  );
}
