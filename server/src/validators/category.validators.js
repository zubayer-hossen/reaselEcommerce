import { z } from 'zod';
import { objectId, localizedRequired, localizedOptional, imageInput, seoInput } from './common.validators.js';

const base = z.object({
  name: localizedRequired,
  slug: z.string().trim().max(80).optional(),
  description: localizedOptional(1000).optional(),
  image: imageInput.nullable().optional(),
  icon: z.string().trim().max(40).optional(),
  parent: objectId.nullable().optional(),
  order: z.number().int().min(0).max(9999).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  seo: seoInput.optional(),
});

export const createCategorySchema = base;
export const updateCategorySchema = base.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const uploadSignSchema = z.object({
  folder: z.enum(['categories', 'products', 'banners', 'ads', 'reviews', 'content', 'misc']),
});
