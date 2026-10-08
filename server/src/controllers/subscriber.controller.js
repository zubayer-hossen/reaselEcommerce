import { Subscriber } from '../models/Subscriber.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { verifyUnsubscribeToken } from '../services/marketing.service.js';
import { Customer } from '../models/Customer.js';

const safe = (s) => ({
  _id: s._id, email: s.email, status: s.status, source: s.source,
  subscribedAt: s.subscribedAt, unsubscribedAt: s.unsubscribedAt,
  lastCampaignAt: s.lastCampaignAt, createdAt: s.createdAt,
});

export const subscribe = asyncHandler(async (req, res) => {
  const { email, source } = req.body;
  const existing = await Subscriber.findOne({ email });
  if (existing) {
    if (existing.status === 'subscribed') return res.json({ success: true, message: 'Already subscribed', data: { status: existing.status } });
    existing.status = 'subscribed';
    existing.subscribedAt = new Date();
    existing.unsubscribedAt = undefined;
    existing.source = source;
    existing.ip = req.ip;
    await existing.save();
    await notify({ type: 'new_subscriber', permission: 'marketing:manage', link: '/admin/marketing?tab=subscribers', title: { bn: 'নতুন সাবস্ক্রাইবার', en: 'New subscriber' }, body: { bn: email, en: email }, dedupeKey: `subscriber:${email}` });
    return res.json({ success: true, message: 'Subscription restored', data: { status: existing.status } });
  }
  const subscriber = await Subscriber.create({ email, source, ip: req.ip });
  await notify({ type: 'new_subscriber', permission: 'marketing:manage', link: '/admin/marketing?tab=subscribers', title: { bn: 'নতুন সাবস্ক্রাইবার', en: 'New subscriber' }, body: { bn: email, en: email }, dedupeKey: `subscriber:${email}` });
  res.status(201).json({ success: true, message: 'Subscribed successfully', data: { status: subscriber.status } });
});

export const list = asyncHandler(async (req, res) => {
  const { q, status, page, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.email = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const [total, subscribers] = await Promise.all([
    Subscriber.find(filter).select('-ip').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Subscriber.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'OK', data: { subscribers: subscribers.map(safe), total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);
  if (!subscriber) throw new ApiError(404, 'Subscriber not found');
  subscriber.status = req.body.status;
  if (subscriber.status === 'subscribed') { subscriber.subscribedAt = new Date(); subscriber.unsubscribedAt = undefined; }
  else subscriber.unsubscribedAt = new Date();
  await subscriber.save();
  await logAudit(req, { action: 'subscriber.status', resource: 'Subscriber', resourceId: String(subscriber._id), details: `${subscriber.email} -> ${subscriber.status}` });
  res.json({ success: true, message: 'Subscriber updated', data: { subscriber: safe(subscriber) } });
});

export const remove = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);
  if (!subscriber) throw new ApiError(404, 'Subscriber not found');
  await subscriber.deleteOne();
  await logAudit(req, { action: 'subscriber.delete', resource: 'Subscriber', resourceId: String(subscriber._id), details: subscriber.email });
  res.json({ success: true, message: 'Subscriber deleted' });
});


export const unsubscribe = asyncHandler(async (req, res) => {
  const email = verifyUnsubscribeToken(req.query.token);
  if (!email) return res.status(400).type('html').send('<h2>Invalid unsubscribe link</h2><p>This link is invalid or has expired.</p>');

  await Subscriber.updateOne(
    { email },
    { $set: { status: 'unsubscribed', unsubscribedAt: new Date() } },
  );
  await Customer.updateMany(
    { email, 'marketingConsent.email': true },
    { $set: { 'marketingConsent.email': false } },
  );

  return res.type('html').send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head><body style="font-family:Arial,sans-serif;max-width:620px;margin:60px auto;padding:24px;text-align:center"><h2>You have been unsubscribed</h2><p>You will no longer receive Shajghor marketing emails at this address.</p></body></html>');
});
