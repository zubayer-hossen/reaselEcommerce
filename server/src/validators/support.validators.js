import { z } from 'zod';
import { objectId } from './common.validators.js';
import { normalizePhone } from '../utils/phone.js';
import { cleanText } from '../utils/sanitize.js';
import { TICKET_CATEGORIES, TICKET_PRIORITY } from '../models/SupportTicket.js';

const empty = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
// Plain text only: any HTML someone types into a form is stripped before it is stored.
const text = (min, max, msg) => z.string().trim().min(min, msg).max(max).transform((v) => cleanText(v));
const phone = z.string().trim().transform(normalizePhone).refine((v) => v !== '', 'Enter a valid Bangladesh mobile number');
const email = z.preprocess(empty, z.string().trim().toLowerCase().email().max(120).optional());
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(50).default(20);

export const contactSchema = z
  .object({
    name: text(2, 80, 'Enter your name'),
    phone: z.preprocess(empty, phone.optional()),
    email,
    subject: text(3, 120, 'Write a short subject'),
    message: text(10, 2000, 'Write your message (at least 10 characters)'),
    website: z.string().max(0).optional(), // honeypot
  })
  .refine((v) => v.phone || v.email, { path: ['phone'], message: 'Give a phone number or an email so we can reply' });

export const ticketSchema = z.object({
  name: text(2, 80, 'Enter your name'),
  phone,
  email,
  category: z.enum(TICKET_CATEGORIES),
  orderNo: z.preprocess(empty, z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,12}-\d{4}-\d{4,8}$/, 'Order ID looks like SAJ-2026-000125').optional()),
  subject: text(3, 120, 'Write a short subject'),
  message: text(10, 2000, 'Describe the problem (at least 10 characters)'),
  website: z.string().max(0).optional(),
});

export const messageListQuery = z.object({
  page, limit,
  q: z.string().trim().max(80).optional(),
  status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
});
export const messageUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
  adminNote: z.string().trim().max(1000).optional(),
}).refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const ticketListQuery = z.object({
  page, limit,
  q: z.string().trim().max(80).optional(),
  status: z.enum(['open', 'pending', 'resolved']).optional(),
  priority: z.enum(TICKET_PRIORITY).optional(),
  sort: z.enum(['recent', 'priority']).default('recent'),
});
export const ticketUpdateSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved']).optional(),
  priority: z.enum(TICKET_PRIORITY).optional(),
}).refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export const ticketNoteSchema = z.object({ text: z.string().trim().min(1).max(1000).transform((v) => cleanText(v)) });

export const faqSchema = z.object({
  question: z.object({ bn: text(3, 300, 'Write the question'), en: z.preprocess(empty, text(1, 300).optional()) }),
  answer: z.object({ bn: text(3, 3000, 'Write the answer'), en: z.preprocess(empty, text(1, 3000).optional()) }),
  category: z.string().trim().max(40).optional(),
  order: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});
export const faqUpdateSchema = faqSchema.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export const faqReorderSchema = z.object({ ids: z.array(objectId).min(1).max(200) });
