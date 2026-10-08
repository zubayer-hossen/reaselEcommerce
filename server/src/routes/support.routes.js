import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { contactSchema, ticketSchema } from '../validators/support.validators.js';
import * as contact from '../controllers/contact.controller.js';
import * as faq from '../controllers/faq.controller.js';

// Public: contact form, support requests, FAQ list.
const router = Router();
router.post('/contact', contactLimiter, validate(contactSchema), contact.createMessage);
router.post('/support/tickets', contactLimiter, validate(ticketSchema), contact.createTicket);
router.get('/faqs', faq.listPublic);
export default router;
