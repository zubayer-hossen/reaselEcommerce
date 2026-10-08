import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS } from './Order.js';

// SECURITY: never add fields for PIN, OTP, passwords or banking credentials.
const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNo: String,
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    amount: { type: Number, required: true, min: 0 },
    senderPhone: String,      // bKash / Nagad
    trxId: { type: String, trim: true, index: true },
    bankName: String,
    reference: String,        // bank / other reference
    provider: String,         // "other" method
    paymentDate: Date,
    receiptUrl: String,
    notes: String,
    status: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    verifiedAt: Date,
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
