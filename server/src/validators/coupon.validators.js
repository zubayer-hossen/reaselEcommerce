import { z } from 'zod';
import { objectId } from './common.validators.js';

const localizedText = z.object({ bn: z.string().trim().max(500).optional(), en: z.string().trim().max(500).optional() }).optional();
const dateValue = z.preprocess((v) => (v === '' || v == null ? undefined : new Date(v)), z.date().optional());
const ids = z.array(objectId).max(100).optional();

export const couponCreateSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase()),
  description: localizedText,
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  minOrder: z.coerce.number().min(0).optional(),
  startsAt: dateValue,
  expiresAt: dateValue,
  usageLimit: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(1).nullable().optional()),
  products: ids,
  categories: ids,
  isActive: z.boolean().optional(),
});

export const couponUpdateSchema = couponCreateSchema.partial();

export const couponListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
