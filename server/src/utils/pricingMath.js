// Unit price of a product or one of its variants. A variant's own price wins; otherwise the product's.
// A sale price only counts when it is a real discount.
export function unitPrice(product, variant) {
  if (variant && variant.price != null) {
    const sale = variant.salePrice > 0 && variant.salePrice < variant.price ? variant.salePrice : variant.price;
    return { regular: variant.price, price: sale };
  }
  const price = product.salePrice > 0 && product.salePrice < product.regularPrice ? product.salePrice : product.regularPrice;
  return { regular: product.regularPrice, price };
}

// lines: [{ productId, categoryId, lineTotal }] (ids as strings). Returns { ok:true, discount } or { ok:false, code, minOrder? }
export function couponCheck(coupon, lines, subtotal, now = new Date()) {
  if (!coupon) return { ok: false, code: 'not_found' };
  if (!coupon.isActive) return { ok: false, code: 'inactive' };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, code: 'not_started' };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, code: 'expired' };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { ok: false, code: 'limit_reached' };
  if (subtotal < (coupon.minOrder || 0)) return { ok: false, code: 'min_order', minOrder: coupon.minOrder };

  const prods = (coupon.products || []).map(String);
  const cats = (coupon.categories || []).map(String);
  const restricted = prods.length > 0 || cats.length > 0;
  const eligible = lines
    .filter((l) => !restricted || prods.includes(String(l.productId)) || cats.includes(String(l.categoryId)))
    .reduce((s, l) => s + l.lineTotal, 0);
  if (eligible <= 0) return { ok: false, code: 'not_applicable' };

  let discount = coupon.type === 'percent' ? Math.round((eligible * coupon.value) / 100) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(discount, eligible));
  return { ok: true, discount };
}
