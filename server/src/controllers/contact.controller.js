import { ContactMessage } from '../models/ContactMessage.js';
import { SupportTicket, PRIORITY_RANK } from '../models/SupportTicket.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateTicketNo } from '../services/orderNumber.service.js';
import { notify } from '../services/notification.service.js';

// POST /api/contact
export const createMessage = asyncHandler(async (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  const doc = await ContactMessage.create({ name, phone, email, subject, message, ip: req.ip });
  await notify({
    type: 'new_message', permission: 'support:manage', link: `/admin/support?tab=messages&open=${doc._id}`,
    title: { bn: 'নতুন বার্তা', en: 'New message' },
    body: { bn: `${name} — ${subject}`, en: `${name} — ${subject}` },
  });
  res.status(201).json({ success: true, message: 'Message sent', data: {} });
});

// POST /api/support/tickets
export const createTicket = asyncHandler(async (req, res) => {
  const { name, phone, email, category, orderNo, subject, message } = req.body;

  // Link to the order only when the phone matches that order — otherwise anyone could probe which order IDs exist.
  let orderRef;
  if (orderNo) {
    const order = await Order.findOne({ orderNo }).select('customer.phone');
    if (order && order.customer.phone === phone) orderRef = order._id;
  }

  const ticket = await SupportTicket.create({
    ticketNo: await generateTicketNo(), name, phone, email, category, subject, message,
    orderNo, orderRef, priority: 'normal', priorityRank: PRIORITY_RANK.normal, ip: req.ip,
  });
  await notify({
    type: 'new_ticket', permission: 'support:manage', link: `/admin/support?tab=tickets&open=${ticket._id}`,
    title: { bn: 'নতুন সাপোর্ট রিকোয়েস্ট', en: 'New support request' },
    body: { bn: `${ticket.ticketNo} · ${name} — ${subject}`, en: `${ticket.ticketNo} · ${name} — ${subject}` },
  });
  res.status(201).json({ success: true, message: 'Support request received', data: { ticketNo: ticket.ticketNo } });
});
