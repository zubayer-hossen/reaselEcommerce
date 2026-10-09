import mongoose from 'mongoose';
import { localized, seoSchema } from './_shared.js';

// Singleton document (key = 'main'). Everything the owner edits from the admin panel.
const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    siteName: { type: localized, default: () => ({ bn: 'সাজঘর', en: 'Shajghor' }) },
    about: localized,
    policies: {
      privacy: localized,
      terms: localized,
      returns: localized,
      shipping: localized,
      payment: localized,
    },
    logo: String,
    favicon: String,
    contact: {
      phone: String, whatsapp: String, email: String,
      facebookUrl: String, messengerUrl: String,
      address: localized, mapUrl: String, mapEmbed: String,
    },
    social: { instagram: String, youtube: String, tiktok: String },
    currency: { type: String, default: '৳' },
    deliveryZones: {
      type: [{ _id: false, key: String, name: localized, charge: Number }],
      default: () => [
        { key: 'dhaka', name: { bn: 'ঢাকার ভেতরে', en: 'Inside Dhaka' }, charge: 70 },
        { key: 'outside', name: { bn: 'ঢাকার বাইরে', en: 'Outside Dhaka' }, charge: 130 },
      ],
    },
    // Where customers send money. A method is offered at checkout only when it is configured here.
    payment: {
      codEnabled: { type: Boolean, default: true },
      bkash: { number: String, accountType: { type: String, enum: ['personal', 'agent', 'merchant'], default: 'personal' } },
      nagad: { number: String, accountType: { type: String, enum: ['personal', 'agent', 'merchant'], default: 'personal' } },
      bank: { bankName: String, accountName: String, accountNumber: String, branch: String },
      other: { instructions: localized },
    },
    announcement: {
      enabled: { type: Boolean, default: false },
      text: localized,
      link: String,
      background: String, // hex color
      startAt: Date,
      endAt: Date,
    },
    maintenance: { enabled: { type: Boolean, default: false }, message: localized },
    seo: seoSchema,
    defaultTheme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { timestamps: true }
);

siteSettingSchema.statics.getMain = async function getMain() {
  return this.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { new: true, upsert: true });
};

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
