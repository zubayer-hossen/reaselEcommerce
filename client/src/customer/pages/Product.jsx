import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingBag, Zap, PackageX, Truck, Star } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useSeo } from '../../hooks/useSeo.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { formatMoney, formatNumber, localized } from '../../utils/format.js';
import { cld } from '../../utils/cloudinary.js';
import Button from '../../components/ui/Button.jsx';
import ProductGallery from '../../components/product/ProductGallery.jsx';
import ProductScroller from '../../components/ProductScroller.jsx';
import RichText from '../../components/product/RichText.jsx';
import RecentlyViewed, { rememberProduct } from '../../components/product/RecentlyViewed.jsx';
import ReviewsSection from '../../components/product/ReviewsSection.jsx';
import SectionHeader from '../../sections/SectionHeader.jsx';
import AdSlot from '../../components/AdSlot.jsx';

const optionBtn = (on, off) => `min-h-11 min-w-11 rounded-control border px-4 font-medium transition ${on ? 'border-primary bg-primary text-primary-fg' : off ? 'border-dashed border-line text-muted line-through' : 'border-line bg-surface hover:bg-surface-2'}`;

// Effective unit price of a variant: its own price (+ own sale price) when set, otherwise the product's.
function priceOf(product, v) {
  if (v?.price != null) {
    const sale = v.salePrice > 0 && v.salePrice < v.price ? v.salePrice : v.price;
    return { regular: v.price, price: sale };
  }
  return { regular: product.regularPrice, price: product.price };
}

export default function Product() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { siteName } = useSettings();
  const cart = useCart();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(() => api.get(`/products/${slug}`), [slug]);
  const product = data?.product;

  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [jump, setJump] = useState(null);
  const [triedAdd, setTriedAdd] = useState(false);
  const [stickyOn, setStickyOn] = useState(false);
  const actionsRef = useRef(null);

  const variants = product?.variants || [];
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))], [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [variants]);

  // reset choices per product; preselect when there is only one option
  useEffect(() => {
    if (!product) return;
    setColor(colors.length === 1 ? colors[0] : '');
    setSize(sizes.length === 1 ? sizes[0] : '');
    setQty(1);
    setTriedAdd(false);
    window.scrollTo({ top: 0 });
    rememberProduct(product.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const selected = variants.find((v) => (!colors.length || v.color === color) && (!sizes.length || v.size === size));
  const needsChoice = variants.length > 0 && !selected;
  const available = variants.length ? selected?.stock ?? 0 : product?.stock ?? 0;
  const soldOut = product ? product.totalStock <= 0 : false;
  const { regular, price } = product ? priceOf(product, selected) : { regular: 0, price: 0 };
  const discount = regular > price ? Math.round((1 - price / regular) * 100) : 0;

  // when the chosen variant has its own picture, show it
  useEffect(() => {
    if (!product || !selected?.image?.url) return;
    const i = product.images.findIndex((img) => img.url === selected.image.url);
    if (i >= 0) setJump({ index: i, n: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id]);

  useEffect(() => { setQty((q) => Math.max(1, Math.min(q, available || 1))); }, [available]);

  // show the sticky buy bar once the real buttons scroll out of view (phones)
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setStickyOn(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product?._id]);

  const optionAvailable = (kind, value) => variants.some((v) => v[kind] === value && v.stock > 0 && (kind === 'color' ? !size || v.size === size : !color || v.color === color));

  const name = product ? localized(product.name, lang) : '';
  const cat = product?.category;
  const short = localized(product?.shortDescription, lang);
  const desc = localized(product?.description, lang);

  const jsonLd = product && {
    '@context': 'https://schema.org', '@type': 'Product', name,
    image: product.images.map((i) => i.url), description: short || desc?.slice(0, 300), sku: product.sku, brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: { '@type': 'Offer', priceCurrency: 'BDT', price: product.price, availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: typeof window !== 'undefined' ? window.location.href : undefined },
  };
  useSeo({
    title: product ? `${product.seo?.title || name} | ${siteName}` : '', description: product?.seo?.description || short || desc?.slice(0, 160),
    image: product?.images?.[0] ? cld(product.images[0].url, { w: 1200 }) : undefined, jsonLd,
  });

  const addToCart = (goCheckout) => {
    if (needsChoice) { setTriedAdd(true); return; }
    if (available < 1) return;
    cart.add({
      productId: product._id, variantId: selected?._id, slug: product.slug, name: product.name,
      image: selected?.image?.url || product.images?.[0]?.url, price, color: selected?.color, size: selected?.size, qty,
    });
    if (goCheckout) navigate('/checkout');
    else cart.openDrawer();
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-2" aria-hidden="true">
        <div className="aspect-[4/5] animate-pulse rounded-card bg-surface-2" />
        <div className="space-y-4"><div className="h-9 w-3/4 animate-pulse rounded bg-surface-2" /><div className="h-7 w-1/3 animate-pulse rounded bg-surface-2" /><div className="h-40 animate-pulse rounded-card bg-surface-2" /></div>
      </div>
    );
  }
  if (error || !product) {
    const missing = error?.status === 404;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <PackageX className="mx-auto text-accent" size={40} />
        <h1 className="mt-4 text-xl font-semibold">{missing ? t('public.product.notFoundTitle') : t('public.states.loadError')}</h1>
        {missing && <p className="mt-2 text-muted">{t('public.product.notFoundText')}</p>}
        <div className="mt-6 flex justify-center gap-3">
          {!missing && <Button variant="outline" onClick={reload}>{t('public.states.retry')}</Button>}
          <Link to="/shop" className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-medium text-primary-fg">{t('public.product.backToShop')}</Link>
        </div>
      </div>
    );
  }

  const stockLine = soldOut || (!needsChoice && available < 1)
    ? { text: t('public.product.outOfStock'), cls: 'text-danger' }
    : needsChoice ? null
    : available <= product.lowStockThreshold ? { text: `${t('public.product.lowStock')}: ${formatNumber(available, lang)}`, cls: 'text-warning' }
    : { text: t('public.product.inStock'), cls: 'text-success' };

  const specs = [
    product.brand && [t('public.product.specBrand'), product.brand],
    product.sku && [t('public.product.specSku'), product.sku],
    product.materials?.length && [t('public.product.specMaterial'), product.materials.join(', ')],
    ...(product.specs || []).map((s) => [s.key, s.value]),
  ].filter(Boolean);

  const canBuy = !soldOut && !(variants.length > 0 && selected && available < 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-10">
      <AdSlot placement="product_banner" className="mb-8 -mx-4 max-w-none px-0" />
      <nav aria-label="breadcrumb" className="mb-4 overflow-x-auto text-sm text-muted">
        <ol className="flex items-center gap-1 whitespace-nowrap">
          <li><Link to="/" className="hover:text-primary">{t('nav.home')}</Link></li>
          <li aria-hidden="true"><ChevronRight size={14} /></li>
          <li><Link to="/shop" className="hover:text-primary">{t('nav.products')}</Link></li>
          {cat && <><li aria-hidden="true"><ChevronRight size={14} /></li><li><Link to={`/shop?category=${cat.slug}`} className="hover:text-primary">{localized(cat.name, lang)}</Link></li></>}
          <li aria-hidden="true"><ChevronRight size={14} /></li>
          <li aria-current="page" className="max-w-[40vw] truncate text-ink">{name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images || []} name={name} jump={jump} />

        <div>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{name}</h1>

          {product.ratingCount > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-muted">
              <Star size={16} className="fill-accent text-accent" /> {formatNumber(product.ratingAvg.toFixed(1), lang)} · {formatNumber(product.ratingCount, lang)} {t('public.product.reviews')}
            </p>
          )}

          <p className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatMoney(price, lang)}</span>
            {discount > 0 && <>
              <span className="text-lg text-muted line-through">{formatMoney(regular, lang)}</span>
              <span className="rounded-full bg-danger px-2.5 py-1 text-sm font-semibold text-white">-{formatNumber(discount, lang)}%</span>
            </>}
          </p>
          {stockLine && <p className={`mt-2 font-medium ${stockLine.cls}`}>{stockLine.text}</p>}
          {short && <p className="mt-4 text-muted">{short}</p>}

          {colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-semibold">{t('public.product.color')}{color && <span className="ms-2 font-normal text-muted">{color}</span>}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('public.product.color')}>
                {colors.map((c) => <button key={c} type="button" aria-pressed={color === c} onClick={() => setColor(c)} className={optionBtn(color === c, !optionAvailable('color', c))}>{c}</button>)}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 font-semibold">{t('public.product.size')}{size && <span className="ms-2 font-normal text-muted">{size}</span>}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('public.product.size')}>
                {sizes.map((s) => <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={optionBtn(size === s, !optionAvailable('size', s))}>{s}</button>)}
              </div>
            </div>
          )}
          {triedAdd && needsChoice && <p role="alert" className="mt-3 text-sm font-medium text-danger">{t('public.product.chooseOptions')}</p>}

          <div ref={actionsRef} className="mt-7 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{t('public.product.quantity')}</span>
              <div className="flex items-center rounded-control border border-line">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t('public.product.decrease')} className="grid size-11 place-items-center disabled:opacity-40"><Minus size={18} /></button>
                <span className="w-10 text-center font-semibold" aria-live="polite">{formatNumber(qty, lang)}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(available || 1, q + 1))} disabled={qty >= (available || 1)} aria-label={t('public.product.increase')} className="grid size-11 place-items-center disabled:opacity-40"><Plus size={18} /></button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => addToCart(false)} disabled={!canBuy} className="min-h-14 text-base"><ShoppingBag size={20} /> {t('public.product.addToCart')}</Button>
              <Button onClick={() => addToCart(true)} disabled={!canBuy} className="min-h-14 text-base"><Zap size={20} /> {t('public.product.buyNow')}</Button>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <Truck size={22} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">{t('public.product.deliveryTitle')}</p>
              <p className="mt-0.5 text-sm text-muted">{t('public.product.deliveryText')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {desc && (
          <section>
            <h2 className="mb-3 font-display text-2xl font-bold">{t('public.product.description')}</h2>
            <RichText text={desc} />
          </section>
        )}
        {(specs.length > 0 || product.features?.length > 0) && (
          <section>
            {product.features?.length > 0 && (
              <>
                <h2 className="mb-3 font-display text-2xl font-bold">{t('public.product.features')}</h2>
                <ul className="mb-8 list-disc space-y-1.5 ps-5">{product.features.map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            )}
            {specs.length > 0 && (
              <>
                <h2 className="mb-3 font-display text-2xl font-bold">{t('public.product.specs')}</h2>
                <dl className="divide-y divide-line rounded-card border border-line bg-surface">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-end font-medium">{v}</dd></div>
                  ))}
                </dl>
              </>
            )}
          </section>
        )}
      </div>

      {data.related?.length > 0 && (
        <section className="mt-14">
          <SectionHeader title={t('public.product.related')} to={cat ? `/shop?category=${cat.slug}` : '/shop'} />
          <ProductScroller products={data.related} />
        </section>
      )}
      <ReviewsSection productId={product._id} variantId={selected?._id} />
      <RecentlyViewed currentSlug={product.slug} />

      {/* Sticky buy bar (phones) */}
      {stickyOn && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur md:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted">{name}</p>
            <p className="font-bold text-primary">{formatMoney(price, lang)}</p>
          </div>
          <Button className="ms-auto min-h-12 shrink-0" onClick={() => (needsChoice ? window.scrollTo({ top: actionsRef.current.getBoundingClientRect().top + window.scrollY - 200, behavior: 'smooth' }) : addToCart(false))} disabled={!canBuy}>
            <ShoppingBag size={18} /> {t('public.product.addToCart')}
          </Button>
        </div>
      )}
    </div>
  );
}
