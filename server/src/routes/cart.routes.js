import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { quoteLimiter } from '../middleware/rateLimiters.js';
import { quoteSchema } from '../validators/order.validators.js';
import * as cart from '../controllers/cart.controller.js';

const router = Router();
router.post('/quote', quoteLimiter, validate(quoteSchema), cart.quote);
export default router;
