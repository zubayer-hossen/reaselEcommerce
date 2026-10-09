import { Schema } from 'mongoose';

// Bilingual text: { bn, en }
export const localized = new Schema({ bn: { type: String, trim: true }, en: { type: String, trim: true } }, { _id: false });

export const imageSchema = new Schema(
  { url: { type: String, required: true }, publicId: String, alt: String, label: String },
  { _id: false }
);

export const seoSchema = new Schema(
  { title: localized, description: localized, keywords: localized, ogImage: String },
  { _id: false }
);
