import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useQuote, mergeLines } from '../../hooks/useQuote.js';
import { formatMoney } from '../../utils/format.js';
import CartLine from './CartLine.jsx';

// Slide-in mini cart. Opened from the navbar and after "Add to cart".
export default function CartDrawer() {
  const { items, drawer, closeDrawer, setQty, remove, localSubtotal } = useCart();
  const { t, lang } = useLanguage();
  const { pathname } = useLocation();
  const { quote, loading } = useQuote({ items, enabled: drawer });
  const lines = mergeLines(items, quote);
  const blocked = lines.some((l) => l.issue);
  const subtotal = quote ? quote.subtotal : localSubtotal;

  useEffect(() => { closeDrawer(); }, [pathname, closeDrawer]);
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer, closeDrawer]);

  return (
    <AnimatePresence>
      {drawer && (
        <div className="fixed inset-0 z-[52]">
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label={t('public.cart.drawerTitle')}
            className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-bg"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-center justify-between border-b border-line px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
              <h2 className="text-lg font-semibold">{t('public.cart.drawerTitle')}</h2>
              <button onClick={closeDrawer} aria-label={t('public.close')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2"><X size={22} /></button>
            </div>

            {items.length === 0 ? (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <ShoppingBag className="mx-auto text-accent" size={36} />
                  <p className="mt-3 font-semibold">{t('public.cart.empty')}</p>
                  <Link to="/shop" onClick={closeDrawer} className="mt-5 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-medium text-primary-fg">{t('public.cart.continue')}</Link>
                </div>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-4">
                  {lines.map((l) => <CartLine key={l.key} line={l} compact onQty={(q) => setQty(l.key, q)} onRemove={() => remove(l.key)} onNavigate={closeDrawer} />)}
                </ul>
                <div className="border-t border-line bg-surface p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
                  <p className="flex items-center justify-between text-lg font-semibold">
                    <span>{t('public.cart.subtotal')}</span>
                    <span className={loading ? 'opacity-50' : ''}>{formatMoney(subtotal, lang)}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{t('public.cart.priceNote')}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link to="/cart" onClick={closeDrawer} className="inline-flex min-h-12 items-center justify-center rounded-control border border-line font-medium">{t('public.cart.viewCart')}</Link>
                    <Link to="/cart" onClick={closeDrawer} aria-disabled={blocked} className={`inline-flex min-h-12 items-center justify-center rounded-control bg-primary font-medium text-primary-fg ${blocked ? 'pointer-events-none opacity-50' : ''}`}>{t('public.cart.checkoutShort')}</Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
