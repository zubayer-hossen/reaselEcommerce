import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validators.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), auth.resetPassword);

router.get('/me', requireAuth, auth.me);
router.post('/logout-all', requireAuth, auth.logoutAll);
router.post('/change-password', requireAuth, validate(changePasswordSchema), auth.changePassword);

export default router;
