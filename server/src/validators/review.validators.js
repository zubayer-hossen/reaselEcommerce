import { z } from 'zod';
import { objectId, imageInput } from './common.validators.js';
import { normalizePhone, toAsciiDigits } from '../utils/phone.js';

const phone = z.string().trim().transform(normalizePhone).refine((v) => v !== '', 'Enter a valid Bangladesh mobile number');

export const createReviewSchema = z.object({
  orderNo: z.string().trim().min(5).max(40),
  phone,
  productId: objectId,
  variantId: objectId.optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(5).max(1200),
  images: z.array(imageInput.pick({ url: true, publicId: true, alt: true })).max(5).optional(),
  website: z.string().max(0).optional(),
});

export const reviewListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  product: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});

export const reviewUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  adminNote: z.string().trim().max(500).nullable().optional(),
});

export const reviewPublicQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});
