import { Router } from 'express';
import { publicSettings } from '../controllers/settings.controller.js';

const router = Router();
router.get('/public', publicSettings);
export default router;
