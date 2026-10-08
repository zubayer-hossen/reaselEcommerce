import mongoose from 'mongoose';

const localized = {
  bn: { type: String, trim: true, maxlength: 5000 },
  en: { type: String, trim: true, maxlength: 5000 },
};

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  subject: { type: String, required: true, trim: true, maxlength: 180 },
  content: localized,
  audience: { type: String, enum: ['subscribers', 'consented_customers', 'all_marketing'], default: 'subscribers', index: true },
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent', 'partial', 'failed', 'cancelled'], default: 'draft', index: true },
  scheduledAt: Date,
  recipientCount: { type: Number, default: 0 },
  lastPreviewAt: Date,
  sentAt: Date,
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  lastError: { type: String, maxlength: 1000 },
}, { timestamps: true });

campaignSchema.index({ createdAt: -1 });
export const Campaign = mongoose.model('Campaign', campaignSchema);
