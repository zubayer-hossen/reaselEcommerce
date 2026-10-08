import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed', index: true },
  source: { type: String, enum: ['footer', 'checkout', 'manual', 'other'], default: 'footer' },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: Date,
  lastCampaignAt: Date,
  ip: String,
}, { timestamps: true });

subscriberSchema.index({ email: 1 }, { unique: true });
subscriberSchema.index({ status: 1, createdAt: -1 });

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
