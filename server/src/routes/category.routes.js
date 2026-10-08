import { Router } from 'express';
import { listPublic } from '../controllers/categories.controller.js';

const router = Router();
router.get('/', listPublic); // public storefront list (active only)
export default router;
