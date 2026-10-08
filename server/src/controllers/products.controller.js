import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify, slugFrom, uniqueSlug } from '../utils/slugify.js';
import { cleanLocalized } from '../utils/sanitize.js';
import { destroyImage } from '../services/cloudinary.service.js';
import { logAudit } from '../services/audit.service.js';
import { TOTAL_STOCK, PRICE } from '../utils/mongoExprs.js';

// ---------- helpers ----------
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const unique = (arr) => [...new Set(arr.filter(Boolean))];
const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID'); };
const searchRegex = (q) => new RegExp(escapeRegex(q), 'i');

const stockStatusOf = (total, threshold) => (total <= 0 ? 'out_of_stock' : total <= threshold ? 'low_stock' : 'in_stock');

// Shape used by storefront list cards (aggregation results are plain objects, so compute extras here).
function toCard(p) {
  const total = p.totalStock;
  return {
    _id: p._id, name: p.name, slug: p.slug, shortDescription: p.shortDescription,
    image: p.images?.[0] || null, secondImage: p.images?.[1] || null,
    brand: p.brand, regularPrice: p.regularPrice, price: p.price,
    discountPercent: p.price < p.regularPrice ? Math.round((1 - p.price / p.regularPrice) * 100) : 0,
    sizes: p.sizes, colors: p.colors,
    isFeatured: p.isFeatured, isNewArrival: p.isNewArrival, isBestSeller: p.isBestSeller,
    ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
    stockStatus: stockStatusOf(total, p.lowStockThreshold ?? 5),
  };
}

// Validate + clean a create/update body. Returns fields ready for Mongoose.
async function prepare(body) {
  const data = { ...body };

  if (data.category) {
    if (!(await Category.exists({ _id: data.category }))) throw new ApiError(400, 'Category not found');
  }
  if (data.description) data.description = cleanLocalized(data.description);
  if (data.shortDescription) data.shortDescription = cleanLocalized(data.shortDescription);

  if (data.variants) {
    const seen = new Set();
    data.variants = data.variants.map((v) => {
      const key = `${(v.color || '').toLowerCase()}|${(v.size || '').toLowerCase()}`;
      if (seen.has(key)) throw new ApiError(400, `Duplicate variant: ${v.color || ''} ${v.size || ''}`.trim());
      seen.add(key);
      return {
        ...v,
        price: v.price ?? undefined,
        salePrice: v.salePrice ?? undefined,
        image: v.image || undefined,
      };
    });
    // Filters on the storefront use these lists, so keep them in sync with the variants.
    if (data.variants.length) {
      data.sizes = unique(data.variants.map((v) => v.size));
      data.colors = unique(data.variants.map((v) => v.color));
    } else {
      data.sizes = data.sizes ?? []; // all variants removed → drop the derived filter lists
      data.colors = data.colors ?? [];
    }
  }
  return data;
}

// ---------- ADMIN ----------
export const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, q, category, status, stock } = req.query;
  const filter = {};
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ 'name.bn': rx }, { 'name.en': rx }, { sku: rx }, { brand: rx }, { tags: rx }, { 'variants.sku': rx }];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (stock === 'out') filter.$expr = { $eq: [TOTAL_STOCK, 0] };
  if (stock === 'low') filter.$expr = { $and: [{ $gt: [TOTAL_STOCK, 0] }, { $lte: [TOTAL_STOCK, '$lowStockThreshold'] }] };

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).select('-description -specs -seo').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('category', 'name slug'),
  ]);
  res.json({ success: true, message: 'OK', data: { products, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const getAdmin = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'OK', data: { product } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = await prepare(req.body);
  const slug = await uniqueSlug(slugFrom('product', data.slug, data.name.en, data.name.bn), (s) => Product.exists({ slug: s }));
  if (data.salePrice == null) delete data.salePrice;
  const product = await Product.create({ ...data, slug });
  await logAudit(req, { action: 'product.create', resource: 'Product', resourceId: String(product._id), details: data.name.bn });
  res.status(201).json({ success: true, message: 'Product created', data: { product } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureId(id);
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  const data = await prepare(req.body);
  const { slug, images, salePrice, ...rest } = data;

  if (slug) {
    const wanted = slugify(slug);
    if (!wanted) throw new ApiError(400, 'Invalid slug');
    if (await Product.exists({ slug: wanted, _id: { $ne: id } })) throw new ApiError(409, 'This slug is already used');
    product.slug = wanted; // slug only changes when explicitly sent
  }

  if (images) {
    const keep = new Set(images.map((i) => i.publicId).filter(Boolean));
    (product.images || []).forEach((i) => { if (i.publicId && !keep.has(i.publicId)) destroyImage(i.publicId); });
    product.images = images;
  }

  if (salePrice !== undefined) product.salePrice = salePrice === null ? undefined : salePrice;
  Object.assign(product, rest);

  // The schema-level check cannot see the stored regular price when only one of them is sent.
  if (product.salePrice != null && product.salePrice >= product.regularPrice) {
    throw new ApiError(400, 'Validation failed', { salePrice: ['Sale price must be lower than the regular price'] });
  }

  await product.save();
  await logAudit(req, { action: 'product.update', resource: 'Product', resourceId: id, details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'Product updated', data: { product } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureId(id);
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  if (await Order.exists({ 'items.product': id })) {
    throw new ApiError(409, 'This product has orders. Archive it instead of deleting.');
  }
  await product.deleteOne();
  (product.images || []).forEach((i) => destroyImage(i.publicId));
  await logAudit(req, { action: 'product.delete', resource: 'Product', resourceId: id, details: product.name?.bn });
  res.json({ success: true, message: 'Product deleted' });
});

// Low / out-of-stock rows, flattened to one row per product or variant (small catalogs → computed in JS).
export const inventory = asyncHandler(async (req, res) => {
  const mode = req.query.filter === 'out' ? 'out' : req.query.filter === 'all' ? 'all' : 'low';
  const products = await Product.find({ status: { $ne: 'archived' } }).select('name sku images stock lowStockThreshold variants status').limit(500);
  const rows = [];
  for (const p of products) {
    const th = p.lowStockThreshold;
    const push = (stock, extra) => {
      const isOut = stock <= 0;
      const isLow = !isOut && stock <= th;
      if (mode === 'all' || (mode === 'out' && isOut) || (mode === 'low' && (isOut || isLow))) {
        rows.push({ productId: p._id, name: p.name, image: p.images?.[0] || null, threshold: th, stock, status: isOut ? 'out' : isLow ? 'low' : 'ok', ...extra });
      }
    };
    if (p.variants.length) p.variants.forEach((v) => push(v.stock, { variantId: v._id, label: [v.color, v.size].filter(Boolean).join(' / '), sku: v.sku }));
    else push(p.stock, { sku: p.sku });
  }
  rows.sort((a, b) => a.stock - b.stock);
  res.json({ success: true, message: 'OK', data: { rows } });
});

export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureId(id);
  const { variantId, stock } = req.body;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) throw new ApiError(404, 'Variant not found');
    variant.stock = stock;
  } else {
    if (product.variants.length) throw new ApiError(400, 'This product has variants — update a variant stock');
    product.stock = stock;
  }
  await product.save();
  await logAudit(req, { action: 'product.stock', resource: 'Product', resourceId: id, details: `${variantId || 'product'} → ${stock}` });
  res.json({ success: true, message: 'Stock updated' });
});

// ---------- PUBLIC ----------
export const listPublic = asyncHandler(async (req, res) => {
  const { page, limit, q, category, slugs, brand, size, color, minPrice, maxPrice, minRating, inStock, featured, isNew, bestSeller, sort } = req.query;
  const match = { status: 'active' };
  if (slugs) match.slug = { $in: slugs.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 24) };

  if (category) {
    const cat = await Category.findOne({ slug: category, status: 'active' }).select('_id');
    if (!cat) return res.json({ success: true, message: 'OK', data: { products: [], total: 0, page, pages: 1 } });
    const children = await Category.find({ parent: cat._id }).select('_id');
    match.category = { $in: [cat._id, ...children.map((c) => c._id)] };
  }
  if (q) {
    const rx = searchRegex(q);
    match.$or = [{ 'name.bn': rx }, { 'name.en': rx }, { sku: rx }, { brand: rx }, { tags: rx }];
  }
  if (brand) match.brand = brand;
  if (size) match.sizes = size;
  if (color) match.colors = color;
  if (featured === 'true') match.isFeatured = true;
  if (isNew === 'true') match.isNewArrival = true;
  if (bestSeller === 'true') match.isBestSeller = true;
  if (minRating) match.ratingAvg = { $gte: minRating };

  const priceMatch = {};
  if (minPrice != null) priceMatch.$gte = minPrice;
  if (maxPrice != null) priceMatch.$lte = maxPrice;

  const sorts = {
    newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 },
    popular: { soldCount: -1 }, rating: { ratingAvg: -1, ratingCount: -1 },
  };

  const pipeline = [
    { $match: match },
    { $addFields: { price: PRICE, totalStock: TOTAL_STOCK } },
    ...(Object.keys(priceMatch).length ? [{ $match: { price: priceMatch } }] : []),
    ...(inStock === 'true' ? [{ $match: { totalStock: { $gt: 0 } } }] : []),
    { $sort: { ...sorts[sort], _id: 1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit }, { $limit: limit },
          { $project: { name: 1, slug: 1, shortDescription: 1, images: { $slice: ['$images', 2] }, brand: 1, regularPrice: 1, price: 1, totalStock: 1, lowStockThreshold: 1, sizes: 1, colors: 1, isFeatured: 1, isNewArrival: 1, isBestSeller: 1, ratingAvg: 1, ratingCount: 1 } },
        ],
        count: [{ $count: 'n' }],
      },
    },
  ];
  const [result] = await Product.aggregate(pipeline);
  const total = result.count[0]?.n || 0;
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    success: true, message: 'OK',
    data: { products: result.data.map(toCard), total, page, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const suggest = asyncHandler(async (req, res) => {
  const rx = searchRegex(req.query.q);
  const found = await Product.find({ status: 'active', $or: [{ 'name.bn': rx }, { 'name.en': rx }, { sku: rx }, { brand: rx }, { tags: rx }] })
    .select('name slug images').limit(6);
  res.json({
    success: true, message: 'OK',
    data: { suggestions: found.map((p) => ({ _id: p._id, name: p.name, slug: p.slug, image: p.images?.[0] || null })) },
  });
});

export const getPublic = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.aggregate([
    { $match: { status: 'active', category: product.category?._id, _id: { $ne: product._id } } },
    { $addFields: { price: PRICE, totalStock: TOTAL_STOCK } },
    { $sort: { soldCount: -1, createdAt: -1 } },
    { $limit: 8 },
    { $project: { name: 1, slug: 1, shortDescription: 1, images: { $slice: ['$images', 2] }, brand: 1, regularPrice: 1, price: 1, totalStock: 1, lowStockThreshold: 1, sizes: 1, colors: 1, isFeatured: 1, isNewArrival: 1, isBestSeller: 1, ratingAvg: 1, ratingCount: 1 } },
  ]);

  res.set('Cache-Control', 'public, max-age=30');
  res.json({ success: true, message: 'OK', data: { product, related: related.map(toCard) } });
});

// Options for the shop filter panel, computed from products that are actually on sale.
export const filterOptions = asyncHandler(async (req, res) => {
  const [r] = await Product.aggregate([
    { $match: { status: 'active' } },
    { $addFields: { price: PRICE } },
    {
      $facet: {
        brands: [{ $match: { brand: { $type: 'string', $ne: '' } } }, { $group: { _id: '$brand' } }, { $sort: { _id: 1 } }],
        sizes: [{ $unwind: '$sizes' }, { $group: { _id: '$sizes' } }],
        colors: [{ $unwind: '$colors' }, { $group: { _id: '$colors' } }, { $sort: { _id: 1 } }],
        price: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
      },
    },
  ]);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    success: true,
    message: 'OK',
    data: {
      brands: r.brands.map((x) => x._id),
      sizes: r.sizes.map((x) => x._id),
      colors: r.colors.map((x) => x._id),
      price: { min: r.price[0]?.min ?? 0, max: r.price[0]?.max ?? 0 },
    },
  });
});
