import { z } from 'zod';
import { objectId, localizedRequired, localizedOptional, imageInput, seoInput } from './common.validators.js';

const emptyToUndef = (v) => (v === '' ? undefined : v);
const optStr = (max) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const strList = (maxItems, maxLen = 60) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

const VIDEO_HOSTS = ['https://res.cloudinary.com/', 'https://www.youtube.com/', 'https://youtu.be/'];

const variantInput = z
  .object({
    _id: objectId.optional(), // keep the id of existing variants so old orders still point to them
    sku: optStr(60),
    color: optStr(40),
    size: optStr(20),
    price: z.number().min(0).max(10_000_000).nullable().optional(),
    salePrice: z.number().min(0).max(10_000_000).nullable().optional(),
    stock: z.number().int().min(0).max(1_000_000),
    image: imageInput.nullable().optional(),
  })
  .refine((v) => v.color || v.size, 'A variant needs a color or a size');

const shape = z.object({
  name: localizedRequired,
  slug: optStr(80),
  shortDescription: localizedOptional(300).optional(),
  description: localizedOptional(8000).optional(),
  category: objectId,
  subcategory: optStr(80),
  brand: optStr(80),
  sku: optStr(60),
  regularPrice: z.number().min(0).max(10_000_000),
  salePrice: z.number().min(0).max(10_000_000).nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1000),
  images: z.array(imageInput).max(12),
  videos: z.array(z.object({ url: z.string().url().refine((u) => VIDEO_HOSTS.some((h) => u.startsWith(h)), 'Use a YouTube or Cloudinary video link') })).max(3),
  variants: z.array(variantInput).max(100),
  sizes: strList(40, 20),
  colors: strList(40, 40),
  materials: strList(20),
  specs: z.array(z.object({ key: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) })).max(30),
  features: strList(20, 160),
  tags: strList(30, 40),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  seo: seoInput,
  status: z.enum(['draft', 'active', 'archived']),
});

const saleCheck = (v, ctx) => {
  if (v.salePrice != null && v.regularPrice != null && v.salePrice >= v.regularPrice) {
    ctx.addIssue({ code: 'custom', path: ['salePrice'], message: 'Sale price must be lower than the regular price' });
  }
};

// Create: only name/category/price are required, everything else has defaults.
export const createProductSchema = shape
  .partial({
    stock: true, lowStockThreshold: true, images: true, videos: true, variants: true, sizes: true, colors: true,
    materials: true, specs: true, features: true, tags: true, isFeatured: true, isNewArrival: true,
    isBestSeller: true, seo: true, status: true,
  })
  .superRefine(saleCheck);

export const updateProductSchema = shape
  .partial()
  .superRefine(saleCheck)
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

const page = z.coerce.number().int().min(1).default(1);

export const adminListQuery = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(80).optional(),
  category: objectId.optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  stock: z.enum(['low', 'out']).optional(),
});

export const stockUpdateSchema = z.object({
  variantId: objectId.optional(),
  stock: z.number().int().min(0).max(1_000_000),
});

const bool = z.enum(['true', 'false']).optional();

export const publicListQuery = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(48).default(12),
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(), // slug
  slugs: z.string().trim().max(800).optional(), // comma-separated, used by "recently viewed"
  brand: z.string().trim().max(80).optional(),
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(40).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  inStock: bool,
  featured: bool,
  isNew: bool,
  bestSeller: bool,
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
});

export const suggestQuery = z.object({ q: z.string().trim().min(1).max(60) });
