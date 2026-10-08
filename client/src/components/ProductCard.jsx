import { Link } from 'react-router-dom';
import { Package, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { cld } from '../utils/cloudinary.js';
import { formatMoney, formatNumber, localized } from '../utils/format.js';

function Badge({ children, tone }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

// Storefront card. `product` is the card shape returned by GET /api/products.
export default function ProductCard({ product: p }) {
  const { t, lang } = useLanguage();
  const name = localized(p.name, lang);
  const out = p.stockStatus === 'out_of_stock';
  const hasSale = p.discountPercent > 0;

  return (
    <Link to={`/product/${p.slug}`} className="group flex flex-col rounded-card focus-visible:outline-offset-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface-2">
        {p.image?.url ? (
          <>
            <img
              src={cld(p.image.url, { w: 480, h: 600, crop: 'fill' })} alt={p.image.alt || name} loading="lazy"
              className={`size-full object-cover transition duration-500 ${p.secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
            />
            {p.secondImage?.url && (
              <img src={cld(p.secondImage.url, { w: 480, h: 600, crop: 'fill' })} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
            )}
          </>
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-surface-2 to-line text-muted" aria-hidden="true">
            <Package size={36} />
          </div>
        )}

        <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
          {hasSale && <Badge tone="bg-danger text-white">-{formatNumber(p.discountPercent, lang)}%</Badge>}
          {p.isNewArrival && <Badge tone="bg-primary text-primary-fg">{t('public.card.new')}</Badge>}
          {p.isBestSeller && <Badge tone="bg-accent text-ink">{t('public.card.best')}</Badge>}
        </div>

        {out && (
          <div className="absolute inset-0 grid place-items-center bg-bg/60">
            <span className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-bg">{t('public.card.out')}</span>
          </div>
        )}
      </div>

      <div className="px-1 pt-3">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">{name}</h3>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-primary">{formatMoney(p.price, lang)}</span>
          {hasSale && <span className="text-sm text-muted line-through">{formatMoney(p.regularPrice, lang)}</span>}
        </p>
        {p.ratingCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <Star size={14} className="fill-accent text-accent" /> {formatNumber(p.ratingAvg.toFixed(1), lang)} ({formatNumber(p.ratingCount, lang)})
          </p>
        )}
      </div>
    </Link>
  );
}
