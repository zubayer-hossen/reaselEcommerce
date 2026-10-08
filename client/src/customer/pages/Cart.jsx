import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Tag, X, Truck, Loader2, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useQuote, mergeLines } from '../../hooks/useQuote.js';
import { useSeo } from '../../hooks/useSeo.js';
import { formatMoney, formatNumber, localized } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import CartLine from '../../components/cart/CartLine.jsx';

export default function Cart() {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  const { items, setQty, remove, deliveryArea, setDeliveryArea, couponCode, setCouponCode, localSubtotal } = useCart();
  const { quote, loading, error, reload } = useQuote({ items, deliveryArea, couponCode });
  const [codeInput, setCodeInput] = useState('');
  useSeo({ title: `${t('nav.cart')} | ${siteName}`, description: t('public.cart.priceNote') });

  const lines = mergeLines(items, quote);
  const zones = quote?.zones || settings?.deliveryZones || [];
  const blocked = lines.some((l) => l.issue) || (quote?.issues || []).some((i) => i.code === 'invalid_delivery_area');
  const subtotal = quote ? quote.subtotal : localSubtotal;
  const discount = quote?.discount || 0;
  const charge = quote?.deliveryCharge;
  const total = quote ? quote.total : subtotal;
  const couponError = quote?.couponError;
  const couponApplied = quote?.coupon;
  const canProceed = items.length > 0 && !!quote && !blocked && !loading && deliveryArea && charge != null;

  const applyCode = (e) => {
    e.preventDefault();
    if (codeInput.trim()) { setCouponCode(codeInput); setCodeInput(''); }
  };

  const couponMessage = couponError
    ? couponError.code === 'min_order' ? `${t('public.cart.coupon.min_order')} ${formatMoney(couponError.minOrder, lang)}` : t(`public.cart.coupon.${couponError.code}`)
    : null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShoppingBag className="mx-auto text-accent" size={44} />
        <h1 className="mt-4 font-display text-2xl font-bold">{t('public.cart.empty')}</h1>
        <p className="mt-2 text-muted">{t('public.cart.emptyText')}</p>
        <Link to="/shop" className="mt-6 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-medium text-primary-fg">{t('public.cart.continue')}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-32 lg:pb-10">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('nav.cart')} <span className="text-lg font-normal text-muted">({formatNumber(items.reduce((n, i) => n + i.qty, 0), lang)})</span></h1>

      {error && !quote && (
        <div className="mt-6 rounded-card border border-line p-6 text-center">
          <p className="text-muted">{t('public.states.loadError')}</p>
          <Button variant="outline" className="mt-3" onClick={reload}>{t('public.states.retry')}</Button>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <ul className="divide-y divide-line rounded-card border border-line bg-surface px-4">
          {lines.map((l) => <CartLine key={l.key} line={l} onQty={(q) => setQty(l.key, q)} onRemove={() => remove(l.key)} />)}
        </ul>

        <aside className="flex flex-col gap-5">
          {/* Delivery area */}
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Truck size={18} className="text-accent" /> {t('public.cart.delivery')}</h2>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('public.cart.delivery')}>
              {zones.map((z) => (
                <label key={z.key} className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-control border px-3 ${deliveryArea === z.key ? 'border-primary bg-primary/5' : 'border-line'}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="zone" value={z.key} checked={deliveryArea === z.key} onChange={() => setDeliveryArea(z.key)} className="size-5 accent-[rgb(var(--primary))]" />
                    {localized(z.name, lang)}
                  </span>
                  <span className="font-semibold">{formatMoney(z.charge, lang)}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Coupon */}
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Tag size={18} className="text-accent" /> {t('public.cart.couponTitle')}</h2>
            {couponApplied ? (
              <p className="flex items-center justify-between rounded-control bg-success/10 px-3 py-2 text-success">
                <span><strong>{couponApplied.code}</strong> — {t('public.cart.couponApplied')}</span>
                <button onClick={() => setCouponCode('')} aria-label={t('public.cart.couponRemove')} className="grid size-9 place-items-center"><X size={18} /></button>
              </p>
            ) : (
              <form onSubmit={applyCode} className="flex gap-2">
                <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={t('public.cart.couponPlaceholder')} aria-label={t('public.cart.couponTitle')} autoCapitalize="characters" className="min-h-12 min-w-0 flex-1 rounded-control border border-line bg-surface px-3 uppercase placeholder:normal-case" />
                <Button type="submit" variant="outline" disabled={!codeInput.trim()}>{t('public.cart.couponApply')}</Button>
              </form>
            )}
            {couponMessage && (
              <p role="alert" className="mt-2 flex items-center justify-between gap-2 text-sm text-danger">
                <span>{couponCode}: {couponMessage}</span>
                <button onClick={() => setCouponCode('')} className="shrink-0 font-semibold underline">{t('public.cart.couponRemove')}</button>
              </p>
            )}
          </section>

          {/* Summary */}
          <section className="rounded-card border border-line bg-surface p-4">
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between"><dt className="text-muted">{t('public.cart.subtotal')}</dt><dd className="font-medium">{formatMoney(subtotal, lang)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-success"><dt>{t('public.cart.discount')}</dt><dd className="font-medium">-{formatMoney(discount, lang)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">{t('public.cart.deliveryCharge')}</dt><dd className="font-medium">{charge != null ? formatMoney(charge, lang) : <span className="text-sm text-muted">{t('public.cart.deliveryChoose')}</span>}</dd></div>
              <div className="mt-1 flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>{t('public.cart.total')}</dt><dd className={`text-primary ${loading ? 'opacity-50' : ''}`}>{formatMoney(total, lang)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-muted">{t('public.cart.priceNote')}</p>
            <Link
              to="/checkout" aria-disabled={!canProceed}
              className={`mt-4 hidden min-h-14 items-center justify-center gap-2 rounded-control bg-primary text-base font-semibold text-primary-fg lg:flex ${canProceed ? '' : 'pointer-events-none opacity-50'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null} {t('public.cart.checkout')} <ArrowRight size={20} />
            </Link>
            {!deliveryArea && <p className="mt-2 text-sm text-warning">{t('public.cart.deliveryChoose')}</p>}
          </section>
        </aside>
      </div>

      {/* Phones: sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div>
          <p className="text-sm text-muted">{t('public.cart.total')}</p>
          <p className={`text-lg font-bold text-primary ${loading ? 'opacity-50' : ''}`}>{formatMoney(total, lang)}</p>
        </div>
        <Link to="/checkout" aria-disabled={!canProceed} className={`ms-auto inline-flex min-h-12 items-center gap-2 rounded-control bg-primary px-6 font-semibold text-primary-fg ${canProceed ? '' : 'pointer-events-none opacity-50'}`}>
          {t('public.cart.checkout')} <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
