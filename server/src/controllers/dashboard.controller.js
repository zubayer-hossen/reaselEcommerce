import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { startOfTodayBD } from '../utils/time.js';
import { countLowStockRows } from '../services/inventory.service.js';

const DEAD = ['cancelled', 'failed', 'returned']; // do not count as sales

// Real counts straight from the database (charts/rankings live in analytics.controller.js).
export const summary = asyncHandler(async (req, res) => {
  const start = startOfTodayBD();
  const [totalOrders, todayOrders, byStatus, todaySales, customers, products, paymentCheck, lowStock, newMessages, openTickets] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.aggregate([{ $group: { _id: '$orderStatus', n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: start }, orderStatus: { $nin: DEAD } } },
      { $group: { _id: null, sum: { $sum: '$total' } } },
    ]),
    Customer.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Order.countDocuments({ paymentStatus: 'submitted', orderStatus: { $nin: DEAD } }),
    countLowStockRows(), // same rule as the Inventory page (per variant), so the two numbers always agree
    ContactMessage.countDocuments({ status: 'new' }),
    SupportTicket.countDocuments({ status: 'open' }),
  ]);
  const status = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
  res.json({
    success: true,
    message: 'OK',
    data: {
      todayOrders,
      todaySales: todaySales[0]?.sum || 0,
      totalOrders,
      pending: status.pending || 0,
      processing: (status.confirmed || 0) + (status.processing || 0) + (status.packed || 0) + (status.shipped || 0) + (status.out_for_delivery || 0),
      delivered: status.delivered || 0,
      customers,
      products,
      paymentCheck,
      lowStock,
      newMessages,
      openTickets,
    },
  });
});
