import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

export const localizedRequired = z.object({
  bn: z.string().trim().min(1, 'Bangla text is required').max(200),
  en: z.string().trim().max(200).optional(),
});

export const localizedOptional = (max = 2000) =>
  z.object({ bn: z.string().trim().max(max).optional(), en: z.string().trim().max(max).optional() });

// Only images hosted on our Cloudinary are accepted (blocks arbitrary/tracking URLs).
export const imageInput = z.object({
  url: z.string().url().startsWith('https://res.cloudinary.com/', 'Image must be uploaded through the app'),
  publicId: z.string().startsWith('shajghor/').optional(),
  alt: z.string().trim().max(160).optional(),
  label: z.string().trim().max(80).optional(),
});

export const seoInput = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(320).optional(),
  keywords: z.array(z.string().trim().max(40)).max(20).optional(),
});
