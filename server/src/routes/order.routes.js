import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { orderLimiter } from '../middleware/rateLimiters.js';
import { createOrderSchema } from '../validators/order.validators.js';
import * as orders from '../controllers/orders.controller.js';

const router = Router();
router.post('/', orderLimiter, validate(createOrderSchema), orders.createOrder);
export default router;
