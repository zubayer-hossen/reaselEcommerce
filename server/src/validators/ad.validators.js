import { z } from 'zod';

const localized = z.object({
  bn: z.string().trim().max(500).optional(),
  en: z.string().trim().max(500).optional(),
}).refine((v) => v.bn || v.en, 'At least one language value is required');

const url = z.string().trim().max(2000).refine(
  (v) => /^(https?:\/\/|\/|#)/i.test(v),
  'Must be an http(s) URL, internal path or anchor',
);

const date = z.coerce.date().optional().nullable();

const adFields = {
  title: localized,
  body: localized.optional(),
  imageUrl: url.optional().or(z.literal('')),
  mobileImageUrl: url.optional().or(z.literal('')),
  link: url.optional().or(z.literal('')),
  placement: z.enum(['home_hero', 'home_banner', 'shop_banner', 'product_banner', 'popup']).default('home_banner'),
  startsAt: date,
  endsAt: date,
  priority: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
};

const validateDates = (schema) => schema.superRefine((v, ctx) => {
  if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date must be after start date' });
  }
});

export const adCreateSchema = validateDates(
  z.object(adFields).superRefine((v, ctx) => {
    if (!v.imageUrl && !v.mobileImageUrl) {
      ctx.addIssue({ code: 'custom', path: ['imageUrl'], message: 'At least one image is required' });
    }
  }),
);

export const adUpdateSchema = validateDates(z.object(adFields).partial());

export const adListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  placement: z.enum(['home_hero', 'home_banner', 'shop_banner', 'product_banner', 'popup']).optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adAnalyticsQuery = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  placement: adListQuery.shape.placement.optional(),
});
