import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { Coupon } from '../models/Coupon.js';
import { TrackingEvent } from '../models/TrackingEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { startOfTodayBD, startOfDaysAgoBD } from '../utils/time.js';
import { allowedNext, releasesStock, DEFAULT_MESSAGES } from '../utils/orderFlow.js';
import { normalizePhone } from '../utils/phone.js';
import { releaseStock } from '../services/inventory.service.js';
import { logAudit } from '../services/audit.service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accept either the Mongo id or the order number (SAJ-2026-000125).
async function findOrder(idOrNo) {
  if (mongoose.isValidObjectId(idOrNo)) {
    const byId = await Order.findById(idOrNo);
    if (byId) return byId;
  }
  const byNo = await Order.findOne({ orderNo: String(idOrNo).toUpperCase() });
  if (!byNo) throw new ApiError(404, 'Order not found');
  return byNo;
}

// ---------- list ----------
export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, q, status, paymentStatus, method, range } = req.query;
  const filter = {};
  if (status?.length) filter.orderStatus = { $in: status };
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (method) filter.paymentMethod = method;
  if (range) filter.createdAt = { $gte: range === 'today' ? startOfTodayBD() : startOfDaysAgoBD(range === '7d' ? 6 : 29) };

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const phone = normalizePhone(q);
    // a pasted bKash/Nagad TrxID or bank reference should find its order too
    const paid = await Payment.find({ $or: [{ trxId: rx }, { reference: rx }] }).select('order').limit(50);
    filter.$or = [
      { orderNo: rx }, { 'customer.name': rx }, { 'customer.phone': rx },
      ...(phone ? [{ 'customer.phone': phone }] : []),
      ...(paid.length ? [{ _id: { $in: paid.map((p) => p.order) } }] : []),
    ];
  }

  const [total, orders, grouped] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .select('orderNo customer.name customer.phone customer.district items.name items.qty total paymentMethod paymentStatus orderStatus createdAt')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.aggregate([{ $group: { _id: '$orderStatus', n: { $sum: 1 } } }]),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g._id, g.n]));
  counts.all = grouped.reduce((s, g) => s + g.n, 0);
  counts.paymentCheck = await Order.countDocuments({ paymentStatus: 'submitted', orderStatus: { $nin: ['cancelled', 'failed', 'returned'] } });

  res.json({ success: true, message: 'OK', data: { orders, total, page, pages: Math.max(1, Math.ceil(total / limit)), counts } });
});

// ---------- detail ----------
export const getOrder = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  const [payment, events, customer] = await Promise.all([
    Payment.findOne({ order: order._id }).sort({ createdAt: -1 }),
    TrackingEvent.find({ order: order._id }).sort({ createdAt: 1 }).populate('createdBy', 'name'),
    order.customerRef ? Customer.findById(order.customerRef).select('orderCount totalSpent createdAt marketingConsent notes') : null,
  ]);
  res.json({
    success: true, message: 'OK',
    data: { order, payment, events, customer, allowedNext: allowedNext(order.orderStatus) },
  });
});

// ---------- status ----------
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, message, visibleToCustomer, estimatedDelivery } = req.body;
  const order = await findOrder(req.params.id);
  const from = order.orderStatus;
  const allowed = allowedNext(from);
  if (!allowed.includes(status)) {
    throw new ApiError(409, `Cannot change an order from "${from}" to "${status}"`, { code: 'invalid_transition', allowed });
  }

  // Claim the change first (compare-and-set): if another admin changed it a moment ago, we stop here.
  const set = { orderStatus: status };
  if (estimatedDelivery) set.estimatedDelivery = estimatedDelivery;
  const claim = await Order.updateOne({ _id: order._id, orderStatus: from }, { $set: set });
  if (claim.modifiedCount !== 1) throw new ApiError(409, 'This order was just changed by someone else. Reload and try again.', { code: 'stale' });

  // Give back what the order was holding (once).
  if (releasesStock(status) && !order.releasedAt) {
    await releaseStock(order.items.map((i) => ({ productId: i.product, variantId: i.variantId, qty: i.qty, key: order.orderNo })));
    if (status === 'cancelled' && order.coupon?.code) await Coupon.updateOne({ code: order.coupon.code }, { $inc: { usedCount: -1 } });
    if (order.customerRef) await Customer.updateOne({ _id: order.customerRef }, { $inc: { orderCount: -1, totalSpent: -order.total } });
    await Order.updateOne({ _id: order._id }, { $set: { releasedAt: new Date() } });
  }

  // Cash on delivery is collected by the courier: delivered = paid.
  if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
    await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: 'verified' } });
    await Payment.updateOne({ order: order._id }, { $set: { status: 'verified', verifiedBy: req.admin._id, verifiedAt: new Date() } });
  }

  const finalMessage = message?.bn || message?.en ? { bn: message.bn, en: message.en } : DEFAULT_MESSAGES[status];
  await TrackingEvent.create({ order: order._id, orderNo: order.orderNo, status, message: finalMessage, visibleToCustomer, createdBy: req.admin._id });
  await logAudit(req, { action: 'order.status', resource: 'Order', resourceId: String(order._id), details: `${order.orderNo}: ${from} → ${status}` });

  res.json({ success: true, message: 'Status updated', data: { orderStatus: status, allowedNext: allowedNext(status) } });
});

// ---------- custom tracking message (no status change) ----------
export const addTracking = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  const { message, visibleToCustomer } = req.body;
  const event = await TrackingEvent.create({
    order: order._id, orderNo: order.orderNo, status: order.orderStatus, message, visibleToCustomer, createdBy: req.admin._id,
  });
  await logAudit(req, { action: 'order.tracking', resource: 'Order', resourceId: String(order._id), details: order.orderNo });
  res.status(201).json({ success: true, message: 'Tracking updated', data: { event } });
});

// ---------- payment ----------
export const updatePayment = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await findOrder(req.params.id);
  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 });
  if (!payment) throw new ApiError(404, 'No payment record for this order');
  if (status === 'refunded' && payment.status !== 'verified') throw new ApiError(409, 'Only a verified payment can be refunded');

  payment.status = status;
  if (status === 'verified') { payment.verifiedBy = req.admin._id; payment.verifiedAt = new Date(); }
  await payment.save();
  await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: status } });
  await logAudit(req, { action: 'payment.status', resource: 'Order', resourceId: String(order._id), details: `${order.orderNo}: ${payment.status}` });
  res.json({ success: true, message: 'Payment updated', data: { paymentStatus: status } });
});

// ---------- internal note ----------
export const updateNote = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  await Order.updateOne({ _id: order._id }, { $set: { adminNote: req.body.adminNote } });
  await logAudit(req, { action: 'order.note', resource: 'Order', resourceId: String(order._id), details: order.orderNo });
  res.json({ success: true, message: 'Note saved' });
});
