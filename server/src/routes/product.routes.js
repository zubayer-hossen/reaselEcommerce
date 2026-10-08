import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { publicListQuery, suggestQuery } from '../validators/product.validators.js';
import * as products from '../controllers/products.controller.js';

const router = Router();
router.get('/', validate(publicListQuery, 'query'), products.listPublic);
router.get('/filters', products.filterOptions); // must stay above /:slug
router.get('/suggest', validate(suggestQuery, 'query'), products.suggest); // must stay above /:slug
router.get('/:slug', products.getPublic);
export default router;
