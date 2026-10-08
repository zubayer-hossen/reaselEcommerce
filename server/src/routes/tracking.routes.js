import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { trackLimiter } from '../middleware/rateLimiters.js';
import { lookupSchema } from '../validators/tracking.validators.js';
import * as tracking from '../controllers/tracking.controller.js';

const router = Router();
// POST (not GET) on purpose: the phone digits must never appear in a URL, browser history or server logs.
router.post('/lookup', trackLimiter, validate(lookupSchema), tracking.lookup);
export default router;
