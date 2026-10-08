import { z } from 'zod';
import { cleanText } from '../utils/sanitize.js';

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1).max(300).transform((v) => cleanText(v)),
  lang: z.enum(['bn', 'en']).default('bn'),
  dry: z.boolean().optional(), // admin "test" box: do not log or count
});

const kw = z.string().trim().min(2).max(40);
export const knowledgeSchema = z.object({
  title: z.string().trim().min(2).max(100),
  keywords: z.array(kw).min(1).max(30),
  answer: z.object({ bn: z.string().trim().min(2).max(1500).transform((v) => cleanText(v)), en: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(1500).transform((v) => cleanText(v)).optional()) }),
  active: z.boolean().optional(),
});
export const knowledgeUpdateSchema = knowledgeSchema.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');
