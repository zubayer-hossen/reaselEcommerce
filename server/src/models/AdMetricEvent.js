import mongoose from 'mongoose';

const adMetricEventSchema = new mongoose.Schema(
  {
    ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    type: { type: String, enum: ['impression', 'click'], required: true, index: true },
  },
  { timestamps: true }
);

adMetricEventSchema.index({ ad: 1, type: 1, createdAt: 1 });

export const AdMetricEvent = mongoose.model('AdMetricEvent', adMetricEventSchema);
