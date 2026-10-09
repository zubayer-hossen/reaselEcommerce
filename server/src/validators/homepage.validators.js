import { z } from 'zod';

const localized = z.object({ bn: z.string().max(300).optional(), en: z.string().max(300).optional() }).optional();
export const homepageSectionUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  title: localized,
  subtitle: localized,
  ctaLabel: localized,
  ctaLink: z.string().max(500).optional(),
  badge: localized,
  body: localized,
  desktopImage: z.string().max(2000).optional(),
  mobileImage: z.string().max(2000).optional(),
  videoUrl: z.string().max(2000).optional(),
}).strict();
export const homepageReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0).max(999) })).min(1).max(50),
}).strict();
