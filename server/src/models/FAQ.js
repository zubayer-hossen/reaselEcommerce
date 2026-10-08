import mongoose from 'mongoose';
import { localized } from './_shared.js';

const faqSchema = new mongoose.Schema(
  {
    question: { type: localized, required: true },
    answer: { type: localized, required: true },
    category: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);
faqSchema.index({ active: 1, order: 1 });

export const FAQ = mongoose.model('FAQ', faqSchema);
