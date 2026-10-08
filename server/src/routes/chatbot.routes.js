import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../middleware/rateLimiters.js';
import { chatMessageSchema } from '../validators/chatbot.validators.js';
import * as chat from '../controllers/chatbot.controller.js';

const router = Router();
router.post('/message', chatLimiter, validate(chatMessageSchema), chat.message);
export default router;
