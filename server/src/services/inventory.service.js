import { Product } from '../models/Product.js';
import { notify } from './notification.service.js';

// Stock reservation helpers shared by checkout and admin order changes.
// line = { productId, variantId?, qty, key? }

// Atomic per line (guarded $inc). If any line fails, the ones already taken are given back.
export async function reserveStock(lines) {
  const done = [];
  for (const l of lines) {
    const res = l.variantId
      ? await Product.updateOne(
          { _id: l.productId, variants: { $elemMatch: { _id: l.variantId, stock: { $gte: l.qty } } } },
          { $inc: { 'variants.$.stock': -l.qty, soldCount: l.qty } }
        )
      : await Product.updateOne({ _id: l.productId, stock: { $gte: l.qty } }, { $inc: { stock: -l.qty, soldCount: l.qty } });
    if (res.modifiedCount !== 1) {
      await releaseStock(done);
      return { ok: false, failed: l };
    }
    done.push(l);
  }
  return { ok: true, done };
}

// Never throws: a failed rollback is logged so it can be fixed by hand.
export async function releaseStock(lines) {
  for (const l of lines) {
    try {
      if (l.variantId) {
        await Product.updateOne({ _id: l.productId, 'variants._id': l.variantId }, { $inc: { 'variants.$.stock': l.qty, soldCount: -l.qty } });
      } else {
        await Product.updateOne({ _id: l.productId }, { $inc: { stock: l.qty, soldCount: -l.qty } });
      }
    } catch (err) {
      console.error('[inventory] stock release failed:', l.key || l.productId, err.message);
    }
  }
}

// After stock was taken: alert the admins about anything that is now low or sold out. Never throws.
export async function checkLowStock(lines) {
  try {
    const ids = [...new Set(lines.map((l) => String(l.productId)))];
    const products = await Product.find({ _id: { $in: ids } }).select('name stock lowStockThreshold variants');
    for (const l of lines) {
      const p = products.find((x) => String(x._id) === String(l.productId));
      if (!p) continue;
      const v = l.variantId ? p.variants.id(l.variantId) : null;
      const stock = v ? v.stock : p.stock;
      if (stock > p.lowStockThreshold) continue;
      const out = stock <= 0;
      const label = v ? [v.color, v.size].filter(Boolean).join(' / ') : '';
      await notify({
        type: out ? 'out_of_stock' : 'low_stock',
        permission: 'products:read',
        title: out ? { bn: 'স্টক শেষ', en: 'Out of stock' } : { bn: 'কম স্টক', en: 'Low stock' },
        body: {
          bn: `${p.name.bn}${label ? ` (${label})` : ''} — স্টক ${stock}`,
          en: `${p.name.en || p.name.bn}${label ? ` (${label})` : ''} — stock ${stock}`,
        },
        link: '/admin/inventory',
        dedupeKey: `stock:${p._id}:${l.variantId || ''}:${out ? 'out' : 'low'}`,
      });
    }
  } catch (err) {
    console.error('[inventory] low-stock check failed:', err.message);
  }
}

// How many products/variants are low or out of stock right now (same rule as the Inventory page).
export async function countLowStockRows() {
  const products = await Product.find({ status: { $ne: 'archived' } }).select('stock lowStockThreshold variants').limit(500);
  let n = 0;
  for (const p of products) {
    if (p.variants.length) n += p.variants.filter((v) => v.stock <= p.lowStockThreshold).length;
    else if (p.stock <= p.lowStockThreshold) n += 1;
  }
  return n;
}
