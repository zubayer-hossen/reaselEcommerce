import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);
const KEY = 'cart:v1';
const META = 'cart:meta:v1';

function read(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    return raw ?? fallback;
  } catch { return fallback; }
}

// Guest cart in localStorage (no account needed).
// item = { key, productId, variantId?, slug, name{bn,en}, image?, price, size?, color?, qty }
// `price` here is only a display fallback — real prices always come from POST /api/cart/quote.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { const v = read(KEY, []); return Array.isArray(v) ? v : []; });
  const [meta, setMeta] = useState(() => { const v = read(META, {}); return { deliveryArea: v.deliveryArea || '', couponCode: v.couponCode || '' }; });
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage full/blocked */ } }, [items]);
  useEffect(() => { try { localStorage.setItem(META, JSON.stringify(meta)); } catch { /* ignore */ } }, [meta]);

  const add = useCallback((item) => {
    const key = `${item.productId}:${item.variantId || ''}`;
    setItems((cur) => {
      const found = cur.find((i) => i.key === key);
      if (found) return cur.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + (item.qty || 1)) } : i));
      return [...cur, { ...item, key, qty: item.qty || 1 }];
    });
  }, []);
  const setQty = useCallback((key, qty) => setItems((cur) => (qty < 1 ? cur.filter((i) => i.key !== key) : cur.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i)))), []);
  const remove = useCallback((key) => setItems((cur) => cur.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => { setItems([]); setMeta((m) => ({ ...m, couponCode: '' })); }, []);
  const setDeliveryArea = useCallback((deliveryArea) => setMeta((m) => ({ ...m, deliveryArea })), []);
  const setCouponCode = useCallback((couponCode) => setMeta((m) => ({ ...m, couponCode: couponCode.trim().toUpperCase() })), []);
  const openDrawer = useCallback(() => setDrawer(true), []);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  const value = useMemo(() => ({
    items, add, setQty, remove, clear,
    deliveryArea: meta.deliveryArea, setDeliveryArea,
    couponCode: meta.couponCode, setCouponCode,
    drawer, openDrawer, closeDrawer,
    count: items.reduce((n, i) => n + i.qty, 0),
    localSubtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
  }), [items, add, setQty, remove, clear, meta, setDeliveryArea, setCouponCode, drawer, openDrawer, closeDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
