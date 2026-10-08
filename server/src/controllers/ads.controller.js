import mongoose from 'mongoose';
import { Ad } from '../models/Ad.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';
import { AdMetricEvent } from '../models/AdMetricEvent.js';

const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID'); };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nowFilter = () => ({ isActive: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }] }, { $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }] });

export const listPublic = asyncHandler(async (req, res) => {
  const { placement } = req.query;
  const filter = { ...nowFilter(), ...(placement ? { placement } : {}) };
  const ads = await Ad.find(filter).sort({ priority: -1, createdAt: -1 }).select('-__v -impressions -clicks');
  res.json({ success: true, message: 'OK', data: { ads } });
});

export const impression = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const result = await Ad.updateOne({ _id: req.params.id, ...nowFilter() }, { $inc: { impressions: 1 } });
  if (result.modifiedCount) await AdMetricEvent.create({ ad: req.params.id, type: 'impression' });
  res.json({ success: true, message: 'OK' });
});

export const click = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const result = await Ad.updateOne({ _id: req.params.id, ...nowFilter() }, { $inc: { clicks: 1 } });
  if (result.modifiedCount) await AdMetricEvent.create({ ad: req.params.id, type: 'click' });
  res.json({ success: true, message: 'OK' });
});

export const analytics = asyncHandler(async (req, res) => {
  const { from, to, placement } = req.query;
  const start = new Date(from);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const match = { createdAt: { $gte: start, $lte: end } };
  const adMatch = placement ? { 'adDoc.placement': placement } : {};

  const [summary] = await AdMetricEvent.aggregate([
    { $match: match },
    { $lookup: { from: 'ads', localField: 'ad', foreignField: '_id', as: 'adDoc' } },
    { $unwind: '$adDoc' },
    ...(placement ? [{ $match: adMatch }] : []),
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const totals = { impressions: 0, clicks: 0 };
  const grouped = await AdMetricEvent.aggregate([
    { $match: match },
    { $lookup: { from: 'ads', localField: 'ad', foreignField: '_id', as: 'adDoc' } },
    { $unwind: '$adDoc' },
    ...(placement ? [{ $match: adMatch }] : []),
    { $group: { _id: { ad: '$ad', type: '$type' }, count: { $sum: 1 } } },
    { $group: { _id: '$_id.ad', metrics: { $push: { type: '$_id.type', count: '$count' } } } },
    { $lookup: { from: 'ads', localField: '_id', foreignField: '_id', as: 'ad' } },
    { $unwind: '$ad' },
    { $project: { _id: 0, adId: '$_id', title: '$ad.title', placement: '$ad.placement', priority: '$ad.priority', metrics: 1 } },
    { $sort: { priority: -1 } },
  ]);

  for (const row of grouped) {
    for (const metric of row.metrics) totals[metric.type === 'click' ? 'clicks' : 'impressions'] += metric.count;
    row.impressions = row.metrics.find((m) => m.type === 'impression')?.count || 0;
    row.clicks = row.metrics.find((m) => m.type === 'click')?.count || 0;
    row.ctr = row.impressions ? Number(((row.clicks / row.impressions) * 100).toFixed(2)) : 0;
    delete row.metrics;
  }

  const totalClicks = totals.clicks;
  const totalImpressions = totals.impressions;
  res.json({ success: true, message: 'OK', data: { from: start, to: end, placement: placement || null, summary: { ...totals, ctr: totalImpressions ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0 }, ads: grouped } });
});

export const listAdmin = asyncHandler(async (req, res) => {
  const { q, placement, active, page, limit } = req.query;
  const filter = {};
  if (q) filter.$or = [{ 'title.bn': { $regex: escapeRegex(q), $options: 'i' } }, { 'title.en': { $regex: escapeRegex(q), $options: 'i' } }];
  if (placement) filter.placement = placement;
  if (active) filter.isActive = active === 'true';
  const [total, ads] = await Promise.all([
    Ad.find(filter).sort({ priority: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Ad.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'OK', data: { ads, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const create = asyncHandler(async (req, res) => {
  const ad = await Ad.create(req.body);
  await logAudit(req, { action: 'ad.create', resource: 'Ad', resourceId: String(ad._id), details: ad.title?.en || ad.title?.bn || '' });
  res.status(201).json({ success: true, message: 'Ad created', data: { ad } });
});

export const update = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const ad = await Ad.findById(req.params.id);
  if (!ad) throw new ApiError(404, 'Ad not found');
  Object.assign(ad, req.body);
  await ad.save();
  await logAudit(req, { action: 'ad.update', resource: 'Ad', resourceId: String(ad._id), details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'Ad updated', data: { ad } });
});

export const remove = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const ad = await Ad.findById(req.params.id);
  if (!ad) throw new ApiError(404, 'Ad not found');
  await ad.deleteOne();
  await logAudit(req, { action: 'ad.delete', resource: 'Ad', resourceId: String(ad._id), details: ad.title?.en || ad.title?.bn || '' });
  res.json({ success: true, message: 'Ad deleted' });
});
