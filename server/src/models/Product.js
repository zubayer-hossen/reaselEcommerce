import mongoose from 'mongoose';
import { localized, imageSchema, seoSchema } from './_shared.js';

// Variants are embedded: one product → many color/size combinations, each with own SKU/price/stock/image.
const variantSchema = new mongoose.Schema({
  sku: { type: String, trim: true },
  color: String,
  colorHex: String,
  size: String,
  model: String,
  price: { type: Number, min: 0 },      // falls back to product price when empty
  salePrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  image: imageSchema,
});

const productSchema = new mongoose.Schema(
  {
    name: { type: localized, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: localized,
    description: localized, // sanitized HTML (sanitize on write — Phase 4)
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: String,
    brand: String,
    sku: { type: String, trim: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 }, // used when the product has no variants
    lowStockThreshold: { type: Number, default: 5 },
    images: [imageSchema],  // main + sample gallery (label = caption e.g. "Close-up")
    videos: [{ url: String, publicId: String }],
    variants: [variantSchema],
    sizes: [String],
    colors: [String],
    materials: [String],
    specs: [{ _id: false, key: String, value: String }],
    features: [String],
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    seo: seoSchema,
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
    isDemo: { type: Boolean, default: false }, // seeded sample data — removable with `npm run seed:demo -- --clear`
  },
  { timestamps: true }
);

productSchema.index({ 'name.bn': 'text', 'name.en': 'text', sku: 'text', brand: 'text', tags: 'text' });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, regularPrice: 1 });
productSchema.index({ 'variants.sku': 1 });
// SKU must be unique when present (empty SKUs are stored as undefined, never '').
productSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string' } } });
productSchema.index({ category: 1, status: 1 });

productSchema.virtual('totalStock').get(function totalStock() {
  return this.variants?.length ? this.variants.reduce((s, v) => s + (v.stock || 0), 0) : this.stock;
});
// Sale price only counts when it is a real discount.
productSchema.virtual('price').get(function price() {
  return this.salePrice > 0 && this.salePrice < this.regularPrice ? this.salePrice : this.regularPrice;
});
productSchema.virtual('discountPercent').get(function discountPercent() {
  return this.price < this.regularPrice ? Math.round((1 - this.price / this.regularPrice) * 100) : 0;
});
productSchema.virtual('stockStatus').get(function stockStatus() {
  const total = this.totalStock;
  if (total <= 0) return 'out_of_stock';
  return total <= this.lowStockThreshold ? 'low_stock' : 'in_stock';
});
productSchema.set('toJSON', { virtuals: true });

export const Product = mongoose.model('Product', productSchema);
