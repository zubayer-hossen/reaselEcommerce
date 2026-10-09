import mongoose from 'mongoose';
import { localized } from './_shared.js';

const homepageSectionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  title: localized,
  subtitle: localized,
  ctaLabel: localized,
  ctaLink: { type: String, default: '' },
  badge: localized,
  body: localized,
  desktopImage: { type: String, default: '' },
  mobileImage: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
}, { timestamps: true });

homepageSectionSchema.index({ enabled: 1, sortOrder: 1 });
export const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);
