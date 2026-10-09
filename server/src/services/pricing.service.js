import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { unitPrice, couponCheck } from '../utils/pricingMath.js';

const MAX_QTY = 99;

// The single source of truth for money. The browser's prices are never trusted:
// the cart quote and the order both come from here, using live database prices and stock.
//
// items: [{ productId, variantId?, qty }]
// returns { lines, issues, subtotal, deliveryCharge|null, discount, coupon|null, couponError|null, total, zones }
export async function priceCart({ items, deliveryArea, couponCode }) {
  // merge duplicate lines of the same product+variant
  const merged = new Map();
  for (const it of items) {
    const key = `${it.productId}:${it.variantId || ''}`;
    const prev = merged.get(key);
    merged.set(key, { ...it, key, qty: Math.min(MAX_QTY, (prev?.qty || 0) + it.qty) });
  }

  const products = await Product.find({ _id: { $in: [...new Set(items.map((i) => i.productId))] } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  const issues = [];
  for (const it of merged.values()) {
    const product = byId.get(String(it.productId));
    if (!product || product.status !== 'active') { issues.push({ key: it.key, code: 'unavailable' }); continue; }

    let variant = null;
    if (product.variants.length) {
      if (!it.variantId) { issues.push({ key: it.key, code: 'variant_required' }); continue; }
      variant = product.variants.id(it.variantId);
      if (!variant) { issues.push({ key: it.key, code: 'unavailable' }); continue; }
    } else if (it.variantId) {
      issues.push({ key: it.key, code: 'unavailable' });
      continue;
    }

    const stock = variant ? variant.stock : product.stock;
    if (stock <= 0) issues.push({ key: it.key, code: 'out_of_stock' });
    else if (it.qty > stock) issues.push({ key: it.key, code: 'insufficient_stock', available: stock });

    const { regular, price } = unitPrice(product, variant);
    lines.push({
      key: it.key,
      productId: String(product._id),
      categoryId: String(product.category),
      variantId: variant ? String(variant._id) : undefined,
      slug: product.slug,
      name: { bn: product.name?.bn, en: product.name?.en },
      image: variant?.image?.url || product.images?.[0]?.url,
      sku: variant?.sku || product.sku,
      color: variant?.color,
      size: variant?.size,
      regularPrice: regular,
      unitPrice: price,
      qty: it.qty,
      lineTotal: price * it.qty,
      stock,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  // delivery
  const settings = await SiteSetting.getMain();
  const zones = settings.deliveryZones.map((z) => ({ key: z.key, name: z.name, charge: 0 }));
  let deliveryCharge = null;
  if (deliveryArea) {
    const zone = zones.find((z) => z.key === deliveryArea);
    if (zone) deliveryCharge = 0; // Shajghor policy: delivery is always free.
    else issues.push({ code: 'invalid_delivery_area' });
  }

  // coupon
  let coupon = null;
  let couponError = null;
  let discount = 0;
  if (couponCode) {
    const doc = await Coupon.findOne({ code: couponCode.toUpperCase() });
    const res = couponCheck(doc, lines, subtotal);
    if (res.ok) {
      discount = res.discount;
      coupon = { id: String(doc._id), code: doc.code, type: doc.type, value: doc.value };
    } else {
      couponError = { code: res.code, minOrder: res.minOrder };
    }
  }

  const total = subtotal - discount + (deliveryCharge || 0);
  return { lines, issues, subtotal, deliveryCharge, discount, coupon, couponError, total, zones };
}
