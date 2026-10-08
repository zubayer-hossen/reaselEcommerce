import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    variantId: mongoose.Schema.Types.ObjectId,
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, required: true, trim: true },
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
    images: [{ url: String, publicId: String, alt: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    isVerifiedPurchase: { type: Boolean, default: true },
    adminNote: { type: String, trim: true, maxlength: 500 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ order: 1, product: 1, variantId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
