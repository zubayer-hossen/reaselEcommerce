import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify, slugFrom, uniqueSlug } from '../utils/slugify.js';
import { destroyImage } from '../services/cloudinary.service.js';
import { logAudit } from '../services/audit.service.js';

const ensureId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID');
};

// Two levels only (category → subcategory) keeps navigation simple on mobile.
async function validateParent(parentId, selfId) {
  if (!parentId) return null;
  if (selfId && String(parentId) === String(selfId)) throw new ApiError(400, 'A category cannot be its own parent');
  const parent = await Category.findById(parentId);
  if (!parent) throw new ApiError(400, 'Parent category not found');
  if (parent.parent) throw new ApiError(400, 'Only top-level categories can have subcategories');
  if (selfId && (await Category.exists({ parent: selfId }))) {
    throw new ApiError(400, 'This category already has subcategories, so it cannot become a subcategory');
  }
  return parent._id;
}

const slugTaken = (excludeId) => (slug) => Category.exists({ slug, _id: { $ne: excludeId } });

// ---------- public ----------
export const listPublic = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: 'active' })
    .select('name slug description image icon parent order')
    .sort({ order: 1, createdAt: 1 });
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, message: 'OK', data: { categories } });
});

// ---------- admin ----------
export const listAdmin = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, createdAt: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const byCat = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({
    success: true,
    message: 'OK',
    data: { categories: categories.map((c) => ({ ...c, productCount: byCat[String(c._id)] || 0 })) },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { slug, parent, ...rest } = req.body;
  const parentId = await validateParent(parent);
  const finalSlug = await uniqueSlug(
    slugFrom('category', slug, rest.name.en, rest.name.bn),
    slugTaken()
  );
  const category = await Category.create({ ...rest, slug: finalSlug, parent: parentId });
  await logAudit(req, { action: 'category.create', resource: 'Category', resourceId: String(category._id), details: rest.name.bn });
  res.status(201).json({ success: true, message: 'Category created', data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureId(id);
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  const { slug, parent, image, ...rest } = req.body;

  if (parent !== undefined) category.parent = await validateParent(parent, id);

  // Slug changes only when the admin explicitly sends one — editing a name must not break live URLs.
  if (slug) {
    const wanted = slugify(slug);
    if (!wanted) throw new ApiError(400, 'Invalid slug');
    if (await Category.exists({ slug: wanted, _id: { $ne: id } })) throw new ApiError(409, 'This slug is already used');
    category.slug = wanted;
  }

  if (image !== undefined) {
    const oldId = category.image?.publicId;
    if (oldId && oldId !== image?.publicId) destroyImage(oldId); // fire-and-forget
    category.image = image || undefined;
  }

  Object.assign(category, rest);
  await category.save();
  await logAudit(req, { action: 'category.update', resource: 'Category', resourceId: id, details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'Category updated', data: { category } });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  ensureId(id);
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (await Product.exists({ category: id })) throw new ApiError(409, 'Move or delete the products in this category first');
  if (await Category.exists({ parent: id })) throw new ApiError(409, 'Delete its subcategories first');

  await category.deleteOne();
  if (category.image?.publicId) destroyImage(category.image.publicId);
  await logAudit(req, { action: 'category.delete', resource: 'Category', resourceId: id, details: category.name?.bn });
  res.json({ success: true, message: 'Category deleted' });
});
