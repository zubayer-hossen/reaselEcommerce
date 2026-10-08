import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import settingsRoutes from './settings.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import trackingRoutes from './tracking.routes.js';
import supportRoutes from './support.routes.js';
import chatbotRoutes from './chatbot.routes.js';
import reviewRoutes from './review.routes.js';
import subscriberRoutes from './subscriber.routes.js';
import adRoutes from './ad.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OK',
    data: {
      uptime: Math.round(process.uptime()),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/settings', settingsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/tracking', trackingRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/reviews', reviewRoutes);
router.use('/newsletter', subscriberRoutes);
router.use('/ads', adRoutes);
router.use('/', supportRoutes); // /contact, /support/tickets, /faqs
router.use('/admin', adminRoutes);
// Later: /products, /categories, /orders, /tracking, /settings ...

export default router;
