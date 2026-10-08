import { z } from 'zod';

const localized = z.object({
  bn: z.string().trim().max(5000).optional(),
  en: z.string().trim().max(5000).optional(),
}).refine((v) => Boolean(v.bn || v.en), 'At least one language content is required');

const base = z.object({
  name: z.string().trim().min(2).max(120),
  subject: z.string().trim().min(2).max(180),
  content: localized,
  audience: z.enum(['subscribers', 'consented_customers', 'all_marketing']).default('subscribers'),
  scheduledAt: z.preprocess((v) => (v === '' || v == null ? undefined : new Date(v)), z.date().optional()),
});

export const campaignCreateSchema = base.refine((v) => !v.scheduledAt || v.scheduledAt > new Date(), { message: 'Scheduled time must be in the future', path: ['scheduledAt'] });
export const campaignUpdateSchema = base.partial().refine((v) => !v.scheduledAt || v.scheduledAt > new Date(), { message: 'Scheduled time must be in the future', path: ['scheduledAt'] });
export const campaignListQuery = z.object({ status: z.enum(['draft', 'scheduled', 'cancelled']).optional(), q: z.string().trim().max(80).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) });

export const campaignSendSchema = z.object({ confirm: z.literal(true, { errorMap: () => ({ message: 'Explicit send confirmation is required' }) }) });
