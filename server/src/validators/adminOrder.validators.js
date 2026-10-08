import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../models/Order.js';

const page = z.coerce.number().int().min(1).default(1);
const csv = (values) => z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)).pipe(z.array(z.enum(values)).max(12));

export const orderListQuery = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(80).optional(),
  status: csv(ORDER_STATUS).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  range: z.enum(['today', '7d', '30d']).optional(),
});

const msg = z.object({ bn: z.string().trim().max(300).optional(), en: z.string().trim().max(300).optional() });

export const statusSchema = z.object({
  status: z.enum(ORDER_STATUS),
  message: msg.optional(),
  visibleToCustomer: z.boolean().default(true),
  estimatedDelivery: z.coerce.date().optional(),
});

export const paymentStatusSchema = z.object({ status: z.enum(PAYMENT_STATUS) });

export const trackingSchema = z.object({
  message: z.object({ bn: z.string().trim().min(1, 'Write a message').max(300), en: z.string().trim().max(300).optional() }),
  visibleToCustomer: z.boolean().default(true),
});

export const noteSchema = z.object({ adminNote: z.string().trim().max(1000) });
