import mongoose from 'mongoose';

// Simple "write to us" form. The owner replies by phone / WhatsApp / email (customers have no login).
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new', index: true },
    adminNote: String,
    ip: String,
  },
  { timestamps: true }
);
contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
