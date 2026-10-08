import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(120);
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const subscribeSchema = z.object({
  email,
  source: z.enum(['footer', 'checkout', 'other']).default('footer'),
  website: z.string().max(0).optional(),
});

export const subscriberListQuery = z.object({
  page, limit,
  q: z.string().trim().max(120).optional(),
  status: z.enum(['subscribed', 'unsubscribed']).optional(),
});

export const subscriberStatusSchema = z.object({
  status: z.enum(['subscribed', 'unsubscribed']),
});
