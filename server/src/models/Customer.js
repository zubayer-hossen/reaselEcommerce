import mongoose from 'mongoose';

// Guest-friendly: no password, no login. Phone is the identity key.
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    addresses: [{ _id: false, address: String, district: String, area: String, postalCode: String }],
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: Date,
    marketingConsent: { email: { type: Boolean, default: false }, sms: { type: Boolean, default: false } },
    notes: String,
  },
  { timestamps: true }
);
customerSchema.index({ email: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
