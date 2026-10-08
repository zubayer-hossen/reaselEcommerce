import mongoose from 'mongoose';
import { ContactMessage } from '../models/ContactMessage.js';
import { SupportTicket, PRIORITY_RANK } from '../models/SupportTicket.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizePhone } from '../utils/phone.js';
import { logAudit } from '../services/audit.service.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID'); };
const countsOf = (grouped) => {
  const c = Object.fromEntries(grouped.map((g) => [g._id, g.n]));
  c.all = grouped.reduce((s, g) => s + g.n, 0);
  return c;
};
const searchFilter = (q, fields) => {
  const rx = new RegExp(esc(q), 'i');
  const phone = normalizePhone(q);
  return { $or: [...fields.map((f) => ({ [f]: rx })), ...(phone ? [{ phone }] : [])] };
};

// ---------- contact messages ----------
export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, q, status } = req.query;
  const filter = { ...(status ? { status } : {}), ...(q ? searchFilter(q, ['name', 'phone', 'email', 'subject']) : {}) };
  const [total, messages, grouped] = await Promise.all([
    ContactMessage.countDocuments(filter),
    ContactMessage.find(filter).select('name phone email subject message status createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({ success: true, message: 'OK', data: { messages, total, page, pages: Math.max(1, Math.ceil(total / limit)), counts: countsOf(grouped) } });
});

// Opening a new message marks it as read.
export const getMessage = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const doc = await ContactMessage.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Message not found');
  if (doc.status === 'new') { doc.status = 'read'; await doc.save(); }
  res.json({ success: true, message: 'OK', data: { message: doc } });
});

export const updateMessage = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const doc = await ContactMessage.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Message not found');
  Object.assign(doc, req.body);
  await doc.save();
  await logAudit(req, { action: 'message.update', resource: 'ContactMessage', resourceId: String(doc._id), details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'Updated', data: { message: doc } });
});

// ---------- tickets ----------
export const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, q, status, priority, sort } = req.query;
  const filter = { ...(status ? { status } : {}), ...(priority ? { priority } : {}), ...(q ? searchFilter(q, ['name', 'phone', 'ticketNo', 'subject', 'orderNo']) : {}) };
  const order = sort === 'priority' ? { priorityRank: -1, createdAt: -1 } : { createdAt: -1 };
  const [total, tickets, grouped] = await Promise.all([
    SupportTicket.countDocuments(filter),
    SupportTicket.find(filter).select('ticketNo name phone category subject status priority createdAt').sort(order).skip((page - 1) * limit).limit(limit),
    SupportTicket.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({ success: true, message: 'OK', data: { tickets, total, page, pages: Math.max(1, Math.ceil(total / limit)), counts: countsOf(grouped) } });
});

export const getTicket = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  const order = ticket.orderRef ? await Order.findById(ticket.orderRef).select('orderNo orderStatus paymentStatus total') : null;
  res.json({ success: true, message: 'OK', data: { ticket, order } });
});

export const updateTicket = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (req.body.status) ticket.status = req.body.status;
  if (req.body.priority) { ticket.priority = req.body.priority; ticket.priorityRank = PRIORITY_RANK[req.body.priority]; }
  await ticket.save();
  await logAudit(req, { action: 'ticket.update', resource: 'SupportTicket', resourceId: String(ticket._id), details: `${ticket.ticketNo}: ${Object.entries(req.body).map(([k, v]) => `${k}=${v}`).join(', ')}` });
  res.json({ success: true, message: 'Updated', data: { ticket } });
});

export const addTicketNote = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  ticket.notes.push({ admin: req.admin._id, adminName: req.admin.name, text: req.body.text });
  await ticket.save();
  res.status(201).json({ success: true, message: 'Note added', data: { ticket } });
});
