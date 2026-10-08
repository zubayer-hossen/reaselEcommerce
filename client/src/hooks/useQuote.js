import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

// Live prices, stock, delivery and coupon for the cart, from POST /api/cart/quote (debounced).
// The previous quote stays visible while a new one loads, so the screen never flickers.
export function useQuote({ items, deliveryArea, couponCode, enabled = true }) {
  const payload = useMemo(() => ({
    items: items.map((i) => ({ productId: i.productId, variantId: i.variantId || undefined, qty: i.qty })),
    deliveryArea: deliveryArea || undefined,
    couponCode: couponCode || undefined,
  }), [items, deliveryArea, couponCode]);
  const key = JSON.stringify(payload);
  const [state, setState] = useState({ quote: null, loading: false, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || payload.items.length === 0) { setState({ quote: null, loading: false, error: null }); return undefined; }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    const id = setTimeout(() => {
      api.post('/cart/quote', payload)
        .then((r) => alive && setState({ quote: r.data, loading: false, error: null }))
        .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    }, 250);
    return () => { alive = false; clearTimeout(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick]);

  return { ...state, reload: () => setTick((n) => n + 1) };
}

// Merge what is stored locally with the live line (matched by key).
export function mergeLines(items, quote) {
  const live = new Map((quote?.lines || []).map((l) => [l.key, l]));
  const issues = new Map();
  (quote?.issues || []).forEach((i) => { if (i.key) issues.set(i.key, i); });
  return items.map((item) => {
    const l = live.get(item.key);
    return {
      key: item.key, qty: item.qty, slug: item.slug,
      name: l?.name || item.name,
      image: l?.image || item.image,
      color: l?.color ?? item.color, size: l?.size ?? item.size,
      unitPrice: l?.unitPrice ?? item.price,
      regularPrice: l?.regularPrice,
      lineTotal: l ? l.lineTotal : item.price * item.qty,
      stock: l?.stock,
      issue: issues.get(item.key) || null,
      known: !!l,
    };
  });
}
