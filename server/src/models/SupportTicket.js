import mongoose from 'mongoose';

export const TICKET_CATEGORIES = ['order', 'payment', 'delivery', 'return', 'product', 'other'];
export const TICKET_PRIORITY = ['low', 'normal', 'high', 'urgent'];
export const PRIORITY_RANK = { low: 1, normal: 2, high: 3, urgent: 4 };

const noteSchema = new mongoose.Schema(
  { admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, adminName: String, text: { type: String, required: true }, at: { type: Date, default: Date.now } },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true }, // TKT-2026-000001
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'other' },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    orderNo: String,                                          // what the customer typed
    orderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // set ONLY when the order's phone matches (links returns/refunds to the order)
    status: { type: String, enum: ['open', 'pending', 'resolved'], default: 'open', index: true },
    priority: { type: String, enum: TICKET_PRIORITY, default: 'normal' },
    priorityRank: { type: Number, default: 2 },               // sortable copy of priority
    notes: [noteSchema],                                      // internal timeline (never shown to customers)
    ip: String,
  },
  { timestamps: true }
);
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ priorityRank: -1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', ticketSchema);
