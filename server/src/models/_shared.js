import { Schema } from 'mongoose';

// Bilingual text: { bn, en }
export const localized = new Schema({ bn: { type: String, trim: true }, en: { type: String, trim: true } }, { _id: false });

export const imageSchema = new Schema(
  { url: { type: String, required: true }, publicId: String, alt: String, label: String },
  { _id: false }
);

export const seoSchema = new Schema(
  { title: String, description: String, keywords: [String], ogImage: String },
  { _id: false }
);
