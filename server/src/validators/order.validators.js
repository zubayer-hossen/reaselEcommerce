import { z } from 'zod';
import { objectId } from './common.validators.js';
import { normalizePhone, toAsciiDigits } from '../utils/phone.js';

const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const cartItems = z
  .array(z.object({ productId: objectId, variantId: objectId.optional(), qty: z.number().int().min(1).max(99) }))
  .min(1, 'Cart is empty')
  .max(30);

export const quoteSchema = z.object({
  items: cartItems,
  deliveryArea: z.string().trim().max(30).optional(),
  couponCode: z.string().trim().max(40).optional(),
});

const phone = z.string().trim().transform(normalizePhone).refine((v) => v !== '', 'Enter a valid Bangladesh mobile number');

// strict(): anything we do not list (a "pin", "otp", "password"...) is rejected, never stored.
const payment = z
  .object({
    senderPhone: z.preprocess(emptyToUndef, phone.optional()),
    trxId: z.preprocess(emptyToUndef, z.string().trim().min(4).max(30).regex(/^[A-Za-z0-9\-_/]+$/, 'Letters and numbers only').optional()),
    amount: z.number().positive().max(10_000_000).optional(),
    bankName: z.preprocess(emptyToUndef, z.string().trim().max(80).optional()),
    reference: z.preprocess(emptyToUndef, z.string().trim().max(60).optional()),
    provider: z.preprocess(emptyToUndef, z.string().trim().max(60).optional()),
    paymentDate: z.preprocess(emptyToUndef, z.coerce.date().optional()),
    notes: z.preprocess(emptyToUndef, z.string().trim().max(200).optional()),
  })
  .strict();

export const createOrderSchema = z
  .object({
    items: cartItems,
    deliveryArea: z.string().trim().min(1).max(30),
    couponCode: z.preprocess(emptyToUndef, z.string().trim().max(40).optional()),
    customer: z.object({
      name: z.string().trim().min(2, 'Enter your name').max(80),
      phone,
      email: z.preprocess(emptyToUndef, z.string().trim().toLowerCase().email().max(120).optional()),
      address: z.string().trim().min(8, 'Enter your full address').max(300),
      district: z.string().trim().min(2).max(40),
      area: z.preprocess(emptyToUndef, z.string().trim().max(80).optional()),
      postalCode: z.preprocess((v) => emptyToUndef(typeof v === 'string' ? toAsciiDigits(v) : v), z.string().trim().regex(/^\d{4}$/, 'Postal code has 4 digits').optional()),
    }),
    paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'bank', 'other']),
    payment: payment.optional(),
    note: z.preprocess(emptyToUndef, z.string().trim().max(300).optional()),
    marketingConsent: z.object({ email: z.boolean().optional(), sms: z.boolean().optional() }).optional(),
    expectedTotal: z.number().min(0).optional(), // total the customer saw; mismatch → 409 so they can confirm the new price
    website: z.string().max(0).optional(),       // honeypot: real people never fill this hidden field
  })
  .superRefine((v, ctx) => {
    const p = v.payment || {};
    const need = (field, message) => {
      if (!p[field]) ctx.addIssue({ code: 'custom', path: ['payment', field], message });
    };
    if (v.paymentMethod === 'bkash' || v.paymentMethod === 'nagad') {
      need('senderPhone', 'Enter the number you paid from');
      need('trxId', 'Enter the transaction ID');
    }
    if (v.paymentMethod === 'bank') {
      need('bankName', 'Enter the bank name');
      need('reference', 'Enter the transaction / reference ID');
    }
    if (v.paymentMethod === 'other') {
      need('provider', 'Enter the payment provider');
      need('reference', 'Enter the transaction / reference ID');
    }
  });
