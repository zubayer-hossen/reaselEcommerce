import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { subscribeSchema } from '../validators/subscriber.validators.js';
import * as subscribers from '../controllers/subscriber.controller.js';

const router = Router();
router.post('/subscribe', contactLimiter, validate(subscribeSchema), subscribers.subscribe);
router.get('/unsubscribe', subscribers.unsubscribe);
export default router;
