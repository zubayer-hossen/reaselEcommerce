import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { TrackingEvent } from '../models/TrackingEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { describeUserAgent } from '../utils/userAgent.js';
import { priceCart } from '../services/pricing.service.js';
import { generateOrderNo } from '../services/orderNumber.service.js';
import { reserveStock, releaseStock, checkLowStock } from '../services/inventory.service.js';
import { notify } from '../services/notification.service.js';
import { SiteSetting } from '../models/SiteSetting.js';

// POST /api/orders — guest checkout. No account, no login.
export const createOrder = asyncHandler(async (req, res) => {
  const body = req.body;

  // A payment method is accepted only if the owner has configured it (same rule as the checkout screen).
  const pay = (await SiteSetting.getMain()).payment || {};
  const methodOk = {
    cod: pay.codEnabled !== false,
    bkash: !!pay.bkash?.number,
    nagad: !!pay.nagad?.number,
    bank: !!pay.bank?.accountNumber,
    other: !!(pay.other?.instructions?.bn || pay.other?.instructions?.en),
  }[body.paymentMethod];
  if (!methodOk) throw new ApiError(400, 'This payment method is not available', { paymentMethod: ['This payment method is not available'] });

  // 1. Price everything again from the database. The browser's prices are never trusted.
  const quote = await priceCart({ items: body.items, deliveryArea: body.deliveryArea, couponCode: body.couponCode });

  if (quote.issues.length) throw new ApiError(409, 'Some items in your cart changed', { code: 'cart_issues', issues: quote.issues });
  if (body.couponCode && quote.couponError) throw new ApiError(409, 'This coupon cannot be used', { code: 'coupon_error', couponError: quote.couponError });
  if (quote.deliveryCharge === null) throw new ApiError(400, 'Choose a delivery area', { deliveryArea: ['Choose a delivery area'] });
  if (body.expectedTotal != null && body.expectedTotal !== quote.total) {
    throw new ApiError(409, 'The total has changed', { code: 'price_changed', total: quote.total });
  }

  // 2. Reserve stock, then the coupon use
  const reserved = await reserveStock(quote.lines);
  if (!reserved.ok) {
    throw new ApiError(409, 'An item just ran out of stock', { code: 'cart_issues', issues: [{ key: reserved.failed.key, code: 'insufficient_stock', available: 0 }] });
  }
  let couponClaimed = false;
  if (quote.coupon) {
    const res = await Coupon.updateOne(
      { _id: quote.coupon.id, isActive: true, $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
      { $inc: { usedCount: 1 } }
    );
    if (res.modifiedCount !== 1) {
      await releaseStock(reserved.done);
      throw new ApiError(409, 'This coupon cannot be used', { code: 'coupon_error', couponError: { code: 'limit_reached' } });
    }
    couponClaimed = true;
  }

  const c = body.customer;
  let order;
  let customer;
  try {
    // 3. Customer (phone is the identity; no password)
    const set = { name: c.name, lastOrderAt: new Date() };
    if (c.email) set.email = c.email;
    if (body.marketingConsent?.email) set['marketingConsent.email'] = true;
    if (body.marketingConsent?.sms) set['marketingConsent.sms'] = true;
    customer = await Customer.findOneAndUpdate(
      { phone: c.phone },
      { $set: set, $inc: { orderCount: 1, totalSpent: quote.total } },
      { new: true, upsert: true }
    );
    await Customer.updateOne({ _id: customer._id }, { $addToSet: { addresses: { address: c.address, district: c.district, area: c.area, postalCode: c.postalCode } } });

    // 4. Order (items are snapshots: later product edits never change a past order)
    const method = body.paymentMethod;
    order = await Order.create({
      orderNo: await generateOrderNo(),
      customerRef: customer._id,
      customer: { name: c.name, phone: c.phone, email: c.email, address: c.address, district: c.district, area: c.area, postalCode: c.postalCode },
      items: quote.lines.map((l) => ({
        product: l.productId, variantId: l.variantId, name: l.name.bn || l.name.en, image: l.image, sku: l.sku,
        size: l.size, color: l.color, price: l.unitPrice, qty: l.qty,
      })),
      subtotal: quote.subtotal,
      deliveryArea: body.deliveryArea,
      deliveryCharge: quote.deliveryCharge,
      discount: quote.discount,
      coupon: quote.coupon ? { code: quote.coupon.code, amount: quote.discount } : undefined,
      total: quote.total,
      paymentMethod: method,
      paymentStatus: method === 'cod' ? 'pending' : 'submitted',
      note: body.note,
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent')?.slice(0, 250),
        ...describeUserAgent(req.get('user-agent') || ''),
        source: 'web',
      },
    });

    // 5. Payment details exactly as the customer reported them (never PIN/OTP — the schema rejects those)
    const p = body.payment || {};
    await Payment.create({
      order: order._id, orderNo: order.orderNo, method, amount: p.amount ?? quote.total,
      senderPhone: p.senderPhone, trxId: p.trxId, bankName: p.bankName, reference: p.reference,
      provider: p.provider, paymentDate: p.paymentDate, notes: p.notes,
      status: method === 'cod' ? 'pending' : 'submitted',
    });
  } catch (err) {
    // Something failed after stock was taken: put everything back.
    await releaseStock(reserved.done);
    if (couponClaimed) await Coupon.updateOne({ _id: quote.coupon.id }, { $inc: { usedCount: -1 } }).catch(() => {});
    if (customer) await Customer.updateOne({ _id: customer._id }, { $inc: { orderCount: -1, totalSpent: -quote.total } }).catch(() => {});
    if (order) {
      await Order.deleteOne({ _id: order._id }).catch(() => {});
      await Payment.deleteMany({ order: order._id }).catch(() => {});
    }
    throw err;
  }

  // 6. First tracking event (a failure here must not undo a valid order)
  try {
    await TrackingEvent.create({
      order: order._id, orderNo: order.orderNo, status: 'pending',
      message: { bn: 'আপনার অর্ডার গ্রহণ করা হয়েছে', en: 'Your order has been received' },
    });
  } catch (err) {
    console.error('[orders] tracking event failed:', err.message);
  }

  // 7. Tell the admins (each call is failure-proof; none of this can undo a valid order)
  const link = `/admin/orders/${order._id}`;
  const money = `৳${order.total}`;
  await notify({
    type: 'new_order', permission: 'orders:read', link,
    title: { bn: 'নতুন অর্ডার', en: 'New order' },
    body: { bn: `${order.orderNo} · ${order.customer.name} · ${money}`, en: `${order.orderNo} · ${order.customer.name} · ${money}` },
  });
  if (order.paymentMethod !== 'cod') {
    await notify({
      type: 'payment_submitted', permission: 'payments:update', link,
      title: { bn: 'পেমেন্ট যাচাই করুন', en: 'Payment to verify' },
      body: { bn: `${order.orderNo} · ${order.paymentMethod} · ${money}`, en: `${order.orderNo} · ${order.paymentMethod} · ${money}` },
    });
  }
  await checkLowStock(reserved.done);

  res.status(201).json({
    success: true,
    message: 'Order placed',
    data: {
      order: {
        orderNo: order.orderNo,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        total: order.total,
        customer: { name: order.customer.name, phone: order.customer.phone },
        items: order.items.map((i) => ({ name: i.name, image: i.image, size: i.size, color: i.color, price: i.price, qty: i.qty })),
      },
    },
  });
});
