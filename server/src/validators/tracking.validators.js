import { z } from 'zod';
import { toAsciiDigits } from '../utils/phone.js';

export const lookupSchema = z.object({
  orderNo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,12}-\d{4}-\d{4,8}$/, 'Enter the order ID like SAJ-2026-000125'),
  // Bangla digits are fine: ৭৮৯০ → 7890
  phoneLast4: z.preprocess((v) => (typeof v === 'string' ? toAsciiDigits(v.trim()) : v), z.string().regex(/^\d{4}$/, 'Enter the last 4 digits of your phone number')),
});
