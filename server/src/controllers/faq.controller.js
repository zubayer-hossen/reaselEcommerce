import mongoose from 'mongoose';
import { FAQ } from '../models/FAQ.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID'); };

// public
export const listPublic = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find({ active: true }).select('question answer category order').sort({ order: 1, createdAt: 1 });
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, message: 'OK', data: { faqs } });
});

// admin
export const listAdmin = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find().sort({ order: 1, createdAt: 1 });
  res.json({ success: true, message: 'OK', data: { faqs } });
});

export const createFaq = asyncHandler(async (req, res) => {
  const last = await FAQ.findOne().sort({ order: -1 }).select('order');
  const faq = await FAQ.create({ ...req.body, order: req.body.order ?? (last ? last.order + 1 : 0) });
  await logAudit(req, { action: 'faq.create', resource: 'FAQ', resourceId: String(faq._id), details: faq.question.bn });
  res.status(201).json({ success: true, message: 'FAQ created', data: { faq } });
});

export const updateFaq = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const faq = await FAQ.findById(req.params.id);
  if (!faq) throw new ApiError(404, 'FAQ not found');
  Object.assign(faq, req.body);
  await faq.save();
  await logAudit(req, { action: 'faq.update', resource: 'FAQ', resourceId: String(faq._id), details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'FAQ updated', data: { faq } });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, 'FAQ not found');
  await logAudit(req, { action: 'faq.delete', resource: 'FAQ', resourceId: String(faq._id), details: faq.question.bn });
  res.json({ success: true, message: 'FAQ deleted' });
});

// body: { ids: [...] } in the new order → order = position
export const reorder = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await FAQ.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
  await logAudit(req, { action: 'faq.reorder', resource: 'FAQ' });
  res.json({ success: true, message: 'Order saved' });
});
