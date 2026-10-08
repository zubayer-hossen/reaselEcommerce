import mongoose from 'mongoose';
import { localized } from './_shared.js';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: localized,
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },           // cap for percent coupons
    minOrder: { type: Number, default: 0, min: 0 },
    startsAt: Date,
    expiresAt: Date,
    usageLimit: { type: Number, default: null },     // null = unlimited
    usedCount: { type: Number, default: 0 },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],     // empty = all
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],  // empty = all
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
