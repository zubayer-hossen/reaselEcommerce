import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { reviewLimiter } from '../middleware/rateLimiters.js';
import { createReviewSchema, reviewPublicQuery } from '../validators/review.validators.js';
import * as reviews from '../controllers/reviews.controller.js';

const router = Router();
router.get('/product/:productId', validate(reviewPublicQuery, 'query'), reviews.listPublic);
router.post('/', reviewLimiter, validate(createReviewSchema), reviews.create);
export default router;
