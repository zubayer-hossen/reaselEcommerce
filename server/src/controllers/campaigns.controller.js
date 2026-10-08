import mongoose from 'mongoose';
import { Campaign } from '../models/Campaign.js';
import { Subscriber } from '../models/Subscriber.js';
import { Customer } from '../models/Customer.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';
import { env } from '../config/env.js';
import { isEmailConfigured, verifyEmailTransport, sendEmail } from '../services/email.service.js';
import { createUnsubscribeToken } from '../services/marketing.service.js';

const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid campaign ID'); };
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function audienceQuery(audience) {
  if (audience === 'subscribers') return { model: Subscriber, filter: { status: 'subscribed' }, projection: { email: 1 } };
  if (audience === 'consented_customers') return { model: Customer, filter: { email: { $exists: true, $ne: '' }, 'marketingConsent.email': true }, projection: { email: 1, name: 1 } };
  return { model: null, filter: null, projection: null };
}

async function audienceCount(audience) {
  if (audience === 'all_marketing') {
    const [subs, customers] = await Promise.all([
      Subscriber.distinct('email', { status: 'subscribed' }),
      Customer.distinct('email', { email: { $exists: true, $ne: '' }, 'marketingConsent.email': true }),
    ]);
    return new Set([...subs, ...customers].map((email) => String(email).toLowerCase())).size;
  }
  const { model, filter } = await audienceQuery(audience);
  return model.countDocuments(filter);
}

const safe = (c) => c.toObject();

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('\"', '&quot;').replaceAll("'", '&#39;');

const contentForEmail = (campaign) => {
  const content = campaign.content || {};
  return content.bn || content.en || '';
};

async function audienceEmails(audience) {
  if (audience === 'subscribers') {
    return Subscriber.distinct('email', { status: 'subscribed' });
  }
  if (audience === 'consented_customers') {
    return Customer.distinct('email', { email: { $exists: true, $ne: '' }, 'marketingConsent.email': true });
  }
  const [subs, customers] = await Promise.all([
    Subscriber.distinct('email', { status: 'subscribed' }),
    Customer.distinct('email', { email: { $exists: true, $ne: '' }, 'marketingConsent.email': true }),
  ]);
  return [...new Set([...subs, ...customers].map((email) => String(email).trim().toLowerCase()).filter(Boolean))];
}


export const list = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
  const [total, campaigns] = await Promise.all([
    Campaign.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Campaign.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'OK', data: { campaigns: campaigns.map(safe), total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const create = asyncHandler(async (req, res) => {
  const campaign = await Campaign.create({ ...req.body, status: req.body.scheduledAt ? 'scheduled' : 'draft' });
  campaign.recipientCount = await audienceCount(campaign.audience);
  await campaign.save();
  await logAudit(req, { action: 'campaign.create', resource: 'Campaign', resourceId: String(campaign._id), details: `${campaign.name} (${campaign.audience})` });
  res.status(201).json({ success: true, message: 'Campaign draft created', data: { campaign: safe(campaign) } });
});

export const update = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  if (campaign.status === 'cancelled') throw new ApiError(409, 'Cancelled campaigns cannot be edited');
  Object.assign(campaign, req.body);
  if (req.body.scheduledAt) campaign.status = 'scheduled';
  campaign.recipientCount = await audienceCount(campaign.audience);
  await campaign.save();
  await logAudit(req, { action: 'campaign.update', resource: 'Campaign', resourceId: String(campaign._id), details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'Campaign updated', data: { campaign: safe(campaign) } });
});

export const preview = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  const count = await audienceCount(campaign.audience);
  campaign.recipientCount = count;
  campaign.lastPreviewAt = new Date();
  await campaign.save();
  res.json({ success: true, message: 'Audience preview ready', data: { audience: campaign.audience, recipientCount: count } });
});

export const cancel = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  if (campaign.status === 'cancelled') return res.json({ success: true, message: 'Campaign already cancelled' });
  campaign.status = 'cancelled';
  await campaign.save();
  await logAudit(req, { action: 'campaign.cancel', resource: 'Campaign', resourceId: String(campaign._id), details: campaign.name });
  res.json({ success: true, message: 'Campaign cancelled', data: { campaign: safe(campaign) } });
});

export const sendCampaignById = async (campaignId, { req = { ip: 'system' }, admin = null } = {}) => {
  ensureId(campaignId);
  if (!isEmailConfigured()) throw new ApiError(503, 'Gmail SMTP is not configured');

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  if (campaign.status === 'cancelled') throw new ApiError(409, 'Cancelled campaigns cannot be sent');
  if (campaign.status === 'sending' || campaign.status === 'sent') throw new ApiError(409, 'Campaign has already started or completed');
  if (!campaign.subject || !contentForEmail(campaign)) throw new ApiError(400, 'Campaign subject and content are required');

  try {
    await verifyEmailTransport();
  } catch (error) {
    campaign.status = 'failed';
    campaign.lastError = 'Gmail SMTP verification failed';
    await campaign.save();
    throw new ApiError(503, 'Gmail SMTP verification failed. Check EMAIL_USER and EMAIL_APP_PASSWORD.');
  }

  const emails = [...new Set((await audienceEmails(campaign.audience)).map((email) => String(email).trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) throw new ApiError(400, 'No eligible recipients found');
  if (emails.length > env.email.campaignMaxRecipients) {
    throw new ApiError(400, `Campaign exceeds the ${env.email.campaignMaxRecipients}-recipient safety limit`);
  }

  campaign.status = 'sending';
  campaign.recipientCount = emails.length;
  campaign.sentCount = 0;
  campaign.failedCount = 0;
  campaign.lastError = undefined;
  await campaign.save();

  const body = contentForEmail(campaign);
  const unsubscribeBase = `${env.clientUrl.replace(/\/$/, '')}/unsubscribe`;
  let sentCount = 0;
  let failedCount = 0;
  let firstError = '';

  for (const email of emails) {
    try {
      const token = createUnsubscribeToken(email);
      const unsubscribeUrl = `${unsubscribeBase}?token=${encodeURIComponent(token)}`;
      const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(body).replaceAll('\n', '<br>')}</div><hr><p style="font-size:12px;color:#666">If you no longer want marketing emails, <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>`;
      const text = `${body}\n\nUnsubscribe: ${unsubscribeUrl}`;
      await sendEmail({ to: email, subject: campaign.subject, text, html });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      if (!firstError) firstError = error?.message || 'Email delivery failed';
    }
  }

  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  campaign.status = failedCount === 0 ? 'sent' : sentCount > 0 ? 'partial' : 'failed';
  campaign.sentAt = new Date();
  campaign.lastError = firstError || undefined;
  await campaign.save();

  if (sentCount) {
    await Subscriber.updateMany({ status: 'subscribed', email: { $in: emails } }, { $set: { lastCampaignAt: new Date() } });
  }
  await logAudit(req, { action: 'campaign.send', resource: 'Campaign', resourceId: String(campaign._id), details: `${campaign.name}: ${sentCount} sent, ${failedCount} failed`, admin });
  return campaign;
};

export const send = asyncHandler(async (req, res) => {
  const campaign = await sendCampaignById(req.params.id, { req, admin: req.admin });
  res.json({ success: true, message: campaign.failedCount ? 'Campaign partially sent' : 'Campaign sent successfully', data: { campaign: safe(campaign) } });
});
