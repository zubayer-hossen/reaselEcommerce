import { Router } from 'express';
import { publicHomepage } from '../controllers/homepage.controller.js';
const router = Router();
router.get('/public', publicHomepage);
export default router;
