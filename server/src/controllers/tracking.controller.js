import { Order } from '../models/Order.js';
import { TrackingEvent } from '../models/TrackingEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { lastMainStatus } from '../utils/orderFlow.js';

const MAX_FAILS = 5;
const LOCK_MS = 30 * 60 * 1000;

// POST /api/tracking/lookup { orderNo, phoneLast4 }
// Needs BOTH the order ID and the last 4 phone digits. Order numbers are sequential, so the ID alone must never
// open an order. A wrong ID and a wrong phone give the SAME answer (no way to probe which orders exist), and
// 5 wrong digit guesses lock that order's tracking for 30 minutes (a 4-digit code could otherwise be brute-forced).
export const lookup = asyncHandler(async (req, res) => {
  const { orderNo, phoneLast4 } = req.body;
  const noMatch = () => new ApiError(404, 'We could not match that order ID and phone number', { code: 'no_match' });

  const order = await Order.findOne({ orderNo });
  if (!order) throw noMatch();

  if (order.trackLockUntil && order.trackLockUntil > new Date()) {
    throw new ApiError(429, 'Too many wrong attempts for this order. Please try again later.', { code: 'locked' });
  }

  if (!order.customer.phone.endsWith(phoneLast4)) {
    const fails = (order.trackFails || 0) + 1;
    await Order.updateOne(
      { _id: order._id },
      fails >= MAX_FAILS ? { $set: { trackFails: 0, trackLockUntil: new Date(Date.now() + LOCK_MS) } } : { $set: { trackFails: fails } }
    );
    throw noMatch();
  }
  if (order.trackFails) await Order.updateOne({ _id: order._id }, { $set: { trackFails: 0 }, $unset: { trackLockUntil: '' } });

  const all = await TrackingEvent.find({ order: order._id }).sort({ createdAt: 1 }).select('status message createdAt visibleToCustomer');

  // Only customer-safe fields. No address, phone, email, IP, internal notes, admin names or hidden messages.
  res.json({
    success: true,
    message: 'OK',
    data: {
      order: {
        orderNo: order.orderNo,
        orderStatus: order.orderStatus,
        lastMainStatus: lastMainStatus(order.orderStatus, all.map((e) => e.status)),
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        items: order.items.map((i) => ({ name: i.name, image: i.image, color: i.color, size: i.size, qty: i.qty })),
      },
      events: all.filter((e) => e.visibleToCustomer).map((e) => ({ status: e.status, message: e.message, createdAt: e.createdAt })),
    },
  });
});
