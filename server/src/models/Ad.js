import mongoose from 'mongoose';
import { localized } from './_shared.js';

const adSchema = new mongoose.Schema(
  {
    title: { type: localized, required: true },
    body: localized,
    imageUrl: { type: String, trim: true, maxlength: 2000 },
    mobileImageUrl: { type: String, trim: true, maxlength: 2000 },
    link: { type: String, trim: true, maxlength: 1000 },
    placement: { type: String, enum: ['home_hero', 'home_banner', 'shop_banner', 'product_banner', 'popup'], default: 'home_banner', index: true },
    startsAt: Date,
    endsAt: Date,
    priority: { type: Number, default: 0, min: 0, max: 9999 },
    isActive: { type: Boolean, default: true, index: true },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

adSchema.index({ placement: 1, isActive: 1, priority: -1 });

export const Ad = mongoose.model('Ad', adSchema);
