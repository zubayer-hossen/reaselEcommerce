import mongoose from 'mongoose';
import { localized, imageSchema, seoSchema } from './_shared.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: localized, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: localized,
    image: imageSchema,
    icon: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    seo: seoSchema,
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDemo: { type: Boolean, default: false }, // seeded sample data — removable with `npm run seed:demo -- --clear`
  },
  { timestamps: true }
);
categorySchema.index({ status: 1, order: 1 });

export const Category = mongoose.model('Category', categorySchema);
