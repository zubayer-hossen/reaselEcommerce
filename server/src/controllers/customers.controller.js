import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizePhone } from '../utils/phone.js';
import { logAudit } from '../services/audit.service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, q, sort } = req.query;
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const phone = normalizePhone(q);
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, ...(phone ? [{ phone }] : [])];
  }
  const sorts = { recent: { lastOrderAt: -1, createdAt: -1 }, spent: { totalSpent: -1 }, orders: { orderCount: -1 } };

  const [total, customers, all, repeat] = await Promise.all([
    Customer.countDocuments(filter),
    Customer.find(filter).select('name phone email orderCount totalSpent lastOrderAt marketingConsent createdAt').sort(sorts[sort]).skip((page - 1) * limit).limit(limit),
    Customer.countDocuments(),
    Customer.countDocuments({ orderCount: { $gte: 2 } }),
  ]);
  res.json({ success: true, message: 'OK', data: { customers, total, page, pages: Math.max(1, Math.ceil(total / limit)), summary: { all, repeat } } });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID');
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  const orders = await Order.find({ customerRef: id }).select('orderNo total orderStatus paymentStatus createdAt').sort({ createdAt: -1 }).limit(30);
  res.json({ success: true, message: 'OK', data: { customer, orders } });
});

export const updateCustomerNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID');
  const res1 = await Customer.updateOne({ _id: id }, { $set: { notes: req.body.notes } });
  if (!res1.matchedCount) throw new ApiError(404, 'Customer not found');
  await logAudit(req, { action: 'customer.note', resource: 'Customer', resourceId: id });
  res.json({ success: true, message: 'Note saved' });
});
