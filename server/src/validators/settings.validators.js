import { z } from 'zod';

const localized = z.object({
  bn: z.string().trim().max(5000).optional(),
  en: z.string().trim().max(5000).optional(),
}).optional();
const url = z.string().trim().max(2000).refine((v) => /^(https?:\/\/|\/|#)/i.test(v), 'Invalid URL');
const optionalUrl = url.optional().or(z.literal(''));

const deliveryZone = z.object({
  key: z.string().trim().min(1).max(50),
  name: z.object({ bn: z.string().trim().max(120).optional(), en: z.string().trim().max(120).optional() }),
  charge: z.coerce.number().min(0).max(100000),
});

export const siteSettingsUpdateSchema = z.object({
  siteName: z.object({ bn: z.string().trim().max(120).optional(), en: z.string().trim().max(120).optional() }).optional(),
  about: localized,
  policies: z.object({
    privacy: localized, terms: localized, returns: localized, shipping: localized, payment: localized,
  }).optional(),
  logo: optionalUrl,
  favicon: optionalUrl,
  contact: z.object({
    phone: z.string().trim().max(100).optional(),
    whatsapp: z.string().trim().max(100).optional(),
    email: z.string().trim().email().max(200).optional().or(z.literal('')),
    facebookUrl: optionalUrl,
    messengerUrl: optionalUrl,
    address: localized,
    mapUrl: optionalUrl,
    mapEmbed: z.string().trim().max(5000).optional(),
  }).optional(),
  social: z.object({ instagram: optionalUrl, youtube: optionalUrl, tiktok: optionalUrl }).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  deliveryZones: z.array(deliveryZone).max(30).optional(),
  payment: z.object({
    codEnabled: z.boolean().optional(),
    bkash: z.object({ number: z.string().trim().max(100).optional(), accountType: z.enum(['personal', 'agent', 'merchant']).optional() }).optional(),
    nagad: z.object({ number: z.string().trim().max(100).optional(), accountType: z.enum(['personal', 'agent', 'merchant']).optional() }).optional(),
    bank: z.object({ bankName: z.string().trim().max(200).optional(), accountName: z.string().trim().max(200).optional(), accountNumber: z.string().trim().max(100).optional(), branch: z.string().trim().max(200).optional() }).optional(),
    other: z.object({ instructions: localized }).optional(),
  }).optional(),
  announcement: z.object({
    enabled: z.boolean().optional(), text: z.object({ bn: z.string().trim().max(500).optional(), en: z.string().trim().max(500).optional() }).optional(),
    link: optionalUrl, background: z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Invalid hex color').optional(),
    startAt: z.coerce.date().optional().nullable(), endAt: z.coerce.date().optional().nullable(),
  }).optional(),
  maintenance: z.object({ enabled: z.boolean().optional(), message: z.object({ bn: z.string().trim().max(1000).optional(), en: z.string().trim().max(1000).optional() }).optional() }).optional(),
  seo: z.object({
    title: localized, description: localized, keywords: localized, ogImage: optionalUrl,
  }).optional(),
  defaultTheme: z.enum(['light', 'dark']).optional(),
});
