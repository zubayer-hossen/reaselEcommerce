import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cleanText } from '../utils/sanitize.js';
import { normalizePhone } from '../utils/phone.js';
import { logAudit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { refreshRatings, refreshProductRating } from '../services/review.service.js';

const safeReview = (r) => ({
  _id: r._id,
  product: r.product,
  order: r.order,
  customer: { name: r.customer.name },
  rating: r.rating,
  title: r.title,
  comment: r.comment,
  images: r.images || [],
  status: r.status,
  isVerifiedPurchase: r.isVerifiedPurchase,
  createdAt: r.createdAt,
});

const ensureId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID');
};

export const listPublic = asyncHandler(async (req, res) => {
  const { page, limit, rating } = req.query;
  ensureId(req.params.productId);
  const filter = { product: req.params.productId, status: 'approved' };
  if (rating) filter.rating = Number(rating);
  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('customer.name rating title comment images isVerifiedPurchase createdAt'),
  ]);
  res.json({ success: true, message: 'OK', data: { reviews: reviews.map(safeReview), total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const create = asyncHandler(async (req, res) => {
  const { orderNo, phone, productId, variantId, rating, title, comment, images } = req.body;
  const order = await Order.findOne({ orderNo }).select('customer orderStatus items');
  if (!order || normalizePhone(order.customer.phone) !== normalizePhone(phone) || order.orderStatus !== 'delivered') {
    throw new ApiError(400, 'A delivered order matching the order ID and phone is required');
  }
  const item = order.items.find((i) => String(i.product) === String(productId) && (!variantId || String(i.variantId) === String(variantId)));
  if (!item) throw new ApiError(400, 'This product is not part of the order');
  const product = await Product.findOne({ _id: productId, status: { $ne: 'archived' } }).select('_id');
  if (!product) throw new ApiError(404, 'Product not found');

  const duplicate = await Review.exists({ order: order._id, product: productId, variantId: variantId || undefined });
  if (duplicate) throw new ApiError(409, 'You have already reviewed this purchase');

  const review = await Review.create({
    product: productId,
    order: order._id,
    variantId,
    customer: { name: cleanText(order.customer.name), phone: normalizePhone(order.customer.phone) },
    rating,
    title: title ? cleanText(title) : undefined,
    comment: cleanText(comment),
    images,
    status: 'pending',
    isVerifiedPurchase: true,
  });
  await notify({ type: 'new_review', permission: 'reviews:moderate', title: 'New product review', body: `${order.customer.name} submitted a ${rating}/5 review`, link: `/admin/reviews`, dedupeKey: `review:${review._id}` });
  res.status(201).json({ success: true, message: 'Review submitted for moderation', data: { review: safeReview(review) } });
});

export const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, status, rating, product, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (rating) filter.rating = Number(rating);
  if (product) filter.product = product;
  if (q) filter.$or = [{ 'customer.name': { $regex: q, $options: 'i' } }, { comment: { $regex: q, $options: 'i' } }];
  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('product', 'name slug images').populate('order', 'orderNo customer.phone'),
  ]);
  res.json({ success: true, message: 'OK', data: { reviews, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  const oldStatus = review.status;
  if (req.body.status) review.status = req.body.status;
  if (req.body.adminNote !== undefined) review.adminNote = req.body.adminNote || undefined;
  await review.save();
  if (oldStatus !== review.status) await refreshProductRating(review.product);
  await logAudit(req, { action: 'review.moderate', resource: 'Review', resourceId: String(review._id), details: `${oldStatus} → ${review.status}` });
  res.json({ success: true, message: 'Review updated', data: { review } });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  const productId = review.product;
  await review.deleteOne();
  await refreshProductRating(productId);
  await logAudit(req, { action: 'review.delete', resource: 'Review', resourceId: String(review._id), details: review.comment?.slice(0, 100) });
  res.json({ success: true, message: 'Review deleted' });
});

export const recalculate = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $ne: 'archived' } }).select('_id').lean();
  await refreshRatings(products.map((p) => p._id));
  res.json({ success: true, message: 'Ratings recalculated', data: { products: products.length } });
});
