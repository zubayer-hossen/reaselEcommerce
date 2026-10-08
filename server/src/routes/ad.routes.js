import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { adListQuery } from '../validators/ad.validators.js';
import * as ads from '../controllers/ads.controller.js';

const router = Router();
router.get('/', validate(adListQuery.pick({ placement: true })), ads.listPublic);
router.post('/:id/impression', ads.impression);
router.post('/:id/click', ads.click);
export default router;
