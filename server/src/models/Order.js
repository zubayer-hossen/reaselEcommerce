import mongoose from 'mongoose';

export const ORDER_STATUS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed'];
export const PAYMENT_METHODS = ['cod', 'bkash', 'nagad', 'bank', 'other'];
export const PAYMENT_STATUS = ['pending', 'submitted', 'verified', 'rejected', 'refunded'];

// Items are snapshots: later product edits must not change past orders.
const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    image: String,
    sku: String,
    size: String,
    color: String,
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true }, // e.g. SAJ-2026-000125
    customerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, lowercase: true, trim: true },
      address: { type: String, required: true },
      district: { type: String, required: true },
      area: String,
      postalCode: String,
    },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true },
    deliveryArea: String,
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    coupon: { code: String, amount: Number },
    total: { type: Number, required: true },
    advanceAmount: { type: Number, default: 150, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    estimatedDelivery: Date,
    trackFails: { type: Number, default: 0 },   // wrong phone-digit attempts on the public tracking page
    trackLockUntil: Date,                        // tracking locked until then (brute-force protection)
    releasedAt: Date, // set once stock/coupon/customer totals were given back (cancel/fail/return) — prevents double release
    note: String,        // customer note
    adminNote: String,   // internal
    // Audit metadata (disclosed in the privacy policy). IP is not treated as precise location.
    meta: { ip: String, userAgent: String, device: String, browser: String, os: String, source: String },
  },
  { timestamps: true }
);

orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

export const Order = mongoose.model('Order', orderSchema);
