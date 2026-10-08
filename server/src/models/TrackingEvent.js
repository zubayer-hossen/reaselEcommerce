import mongoose from 'mongoose';
import { ORDER_STATUS } from './Order.js';
import { localized } from './_shared.js';

const trackingEventSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNo: { type: String, index: true },
    status: { type: String, enum: ORDER_STATUS, required: true },
    message: localized,
    visibleToCustomer: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // empty = system
  },
  { timestamps: true }
);

export const TrackingEvent = mongoose.model('TrackingEvent', trackingEventSchema);
