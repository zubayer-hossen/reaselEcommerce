import { z } from 'zod';
import { objectId } from './common.validators.js';

export const customerListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['recent', 'spent', 'orders']).default('recent'),
});

export const customerNoteSchema = z.object({ notes: z.string().trim().max(1000) });

export const analyticsQuery = z.object({ range: z.enum(['7d', '30d', '90d']).default('30d') });

export const notificationListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export const markReadSchema = z.object({
  ids: z.array(objectId).max(100).optional(),
  all: z.boolean().optional(),
}).refine((v) => v.all || v.ids?.length, 'Nothing to mark');
