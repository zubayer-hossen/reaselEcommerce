import mongoose from 'mongoose';
import { localized } from './_shared.js';

// One notification is shared by every admin who is allowed to see it (`permission`); each admin has their own read state.
const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String, required: true,
      enum: ['new_order', 'payment_submitted', 'low_stock', 'out_of_stock', 'new_message', 'new_review', 'new_ticket', 'new_subscriber'],
    },
    permission: { type: String, required: true }, // who may see it, e.g. 'orders:read'
    title: localized,
    body: localized,
    link: String,                                  // admin path to open, e.g. /admin/orders/<id>
    dedupeKey: String,                             // stops the same alert repeating within 24h
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ dedupeKey: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 }); // auto-clean after 60 days

export const Notification = mongoose.model('Notification', notificationSchema);
