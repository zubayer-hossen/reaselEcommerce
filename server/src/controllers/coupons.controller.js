import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID'); };

async function validateRefs(data) {
  if (data.products?.length) {
    const n = await Product.countDocuments({ _id: { $in: data.products } });
    if (n !== data.products.length) throw new ApiError(400, 'One or more products were not found');
  }
  if (data.categories?.length) {
    const n = await Category.countDocuments({ _id: { $in: data.categories } });
    if (n !== data.categories.length) throw new ApiError(400, 'One or more categories were not found');
  }
  if (data.type === 'percent' && data.value > 100) throw new ApiError(400, 'Percent discount cannot exceed 100');
  if (data.startsAt && data.expiresAt && data.expiresAt < data.startsAt) throw new ApiError(400, 'Expiry must be after start date');
}

const safe = (c) => ({ ...c.toObject(), usageRemaining: c.usageLimit == null ? null : Math.max(0, c.usageLimit - c.usedCount) });

export const list = asyncHandler(async (req, res) => {
  const { q, active, page, limit } = req.query;
  const filter = {};
  if (q) filter.code = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (active) filter.isActive = active === 'true';
  const [total, coupons] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('products', 'name sku').populate('categories', 'name'),
    Coupon.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'OK', data: { coupons: coupons.map(safe), total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, code: req.body.code.toUpperCase() };
  if (await Coupon.exists({ code: data.code })) throw new ApiError(409, 'This coupon code already exists');
  await validateRefs(data);
  const coupon = await Coupon.create(data);
  await logAudit(req, { action: 'coupon.create', resource: 'Coupon', resourceId: String(coupon._id), details: coupon.code });
  res.status(201).json({ success: true, message: 'Coupon created', data: { coupon: safe(coupon) } });
});

export const update = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  const data = { ...req.body };
  if (data.code) data.code = data.code.toUpperCase();
  if (data.code && await Coupon.exists({ code: data.code, _id: { $ne: coupon._id } })) throw new ApiError(409, 'This coupon code already exists');
  await validateRefs({ ...coupon.toObject(), ...data });
  Object.assign(coupon, data);
  await coupon.save();
  await logAudit(req, { action: 'coupon.update', resource: 'Coupon', resourceId: String(coupon._id), details: Object.keys(data).join(',') });
  res.json({ success: true, message: 'Coupon updated', data: { coupon: safe(coupon) } });
});

export const remove = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  if (coupon.usedCount > 0) throw new ApiError(409, 'Used coupons cannot be deleted; deactivate them instead');
  await coupon.deleteOne();
  await logAudit(req, { action: 'coupon.delete', resource: 'Coupon', resourceId: String(coupon._id), details: coupon.code });
  res.json({ success: true, message: 'Coupon deleted' });
});
