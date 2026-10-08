import { Router } from 'express';
import { requireAuth, can, canAny } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAdminSchema, updateAdminSchema } from '../validators/admin.validators.js';
import { createCategorySchema, updateCategorySchema, uploadSignSchema } from '../validators/category.validators.js';
import { createProductSchema, updateProductSchema, adminListQuery, stockUpdateSchema } from '../validators/product.validators.js';
import { orderListQuery, statusSchema, paymentStatusSchema, trackingSchema, noteSchema } from '../validators/adminOrder.validators.js';
import { customerListQuery, customerNoteSchema, analyticsQuery, notificationListQuery, markReadSchema } from '../validators/adminMisc.validators.js';
import { messageListQuery, messageUpdateSchema, ticketListQuery, ticketUpdateSchema, ticketNoteSchema, faqSchema, faqUpdateSchema, faqReorderSchema } from '../validators/support.validators.js';
import * as support from '../controllers/adminSupport.controller.js';
import * as faqs from '../controllers/faq.controller.js';
import { knowledgeSchema, knowledgeUpdateSchema } from '../validators/chatbot.validators.js';
import * as chatbot from '../controllers/adminChatbot.controller.js';
import * as admins from '../controllers/admins.controller.js';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as analytics from '../controllers/analytics.controller.js';
import * as categories from '../controllers/categories.controller.js';
import * as products from '../controllers/products.controller.js';
import * as orders from '../controllers/adminOrders.controller.js';
import * as customers from '../controllers/customers.controller.js';
import * as notifications from '../controllers/notifications.controller.js';
import * as uploads from '../controllers/uploads.controller.js';
import { reviewListQuery, reviewUpdateSchema } from '../validators/review.validators.js';
import * as reviews from '../controllers/reviews.controller.js';
import * as coupons from '../controllers/coupons.controller.js';
import { couponCreateSchema, couponUpdateSchema, couponListQuery } from '../validators/coupon.validators.js';
import { subscriberListQuery, subscriberStatusSchema } from '../validators/subscriber.validators.js';
import * as subscribers from '../controllers/subscriber.controller.js';
import * as campaigns from '../controllers/campaigns.controller.js';
import * as ads from '../controllers/ads.controller.js';
import { adCreateSchema, adUpdateSchema, adListQuery, adAnalyticsQuery } from '../validators/ad.validators.js';
import { campaignCreateSchema, campaignUpdateSchema, campaignListQuery, campaignSendSchema } from '../validators/campaign.validators.js';

// Everything under /api/admin requires a signed-in admin. Later phases add routers here.
const router = Router();
router.use(requireAuth);

router.get('/ping', can('dashboard:view'), (req, res) => {
  res.json({ success: true, message: 'pong', data: { role: req.admin.role } });
});

// Dashboard
router.get('/dashboard/summary', can('dashboard:view'), dashboard.summary);
router.get('/analytics', can('dashboard:view'), validate(analyticsQuery, 'query'), analytics.analytics);

// Admin accounts (owner)
router.get('/admins', can('admins:manage'), admins.listAdmins);
router.post('/admins', can('admins:manage'), validate(createAdminSchema), admins.createAdmin);
router.patch('/admins/:id', can('admins:manage'), validate(updateAdminSchema), admins.updateAdmin);

// Categories
router.get('/categories', canAny('categories:write', 'products:read', 'products:write'), categories.listAdmin);
router.post('/categories', can('categories:write'), validate(createCategorySchema), categories.createCategory);
router.patch('/categories/:id', can('categories:write'), validate(updateCategorySchema), categories.updateCategory);
router.delete('/categories/:id', can('categories:write'), categories.deleteCategory);

// Products + inventory
router.get('/products', can('products:read'), validate(adminListQuery, 'query'), products.listAdmin);
router.get('/products/:id', can('products:read'), products.getAdmin);
router.post('/products', can('products:write'), validate(createProductSchema), products.createProduct);
router.patch('/products/:id', can('products:write'), validate(updateProductSchema), products.updateProduct);
router.delete('/products/:id', can('products:write'), products.deleteProduct);
router.get('/inventory', can('products:read'), products.inventory);
router.patch('/products/:id/stock', can('products:write'), validate(stockUpdateSchema), products.updateStock);

// Orders
router.get('/orders', can('orders:read'), validate(orderListQuery, 'query'), orders.listOrders);
router.get('/orders/:id', can('orders:read'), orders.getOrder);
router.patch('/orders/:id/status', can('orders:update'), validate(statusSchema), orders.updateStatus);
router.patch('/orders/:id/note', can('orders:update'), validate(noteSchema), orders.updateNote);
router.post('/orders/:id/tracking', can('tracking:write'), validate(trackingSchema), orders.addTracking);
router.patch('/orders/:id/payment', can('payments:update'), validate(paymentStatusSchema), orders.updatePayment);

// Customers (sensitive personal data: only roles with customers:read)
router.get('/customers', can('customers:read'), validate(customerListQuery, 'query'), customers.listCustomers);
router.get('/customers/:id', can('customers:read'), customers.getCustomer);
router.patch('/customers/:id', can('customers:write'), validate(customerNoteSchema), customers.updateCustomerNotes);

// Support: contact messages + tickets
router.get('/support/messages', can('support:manage'), validate(messageListQuery, 'query'), support.listMessages);
router.get('/support/messages/:id', can('support:manage'), support.getMessage);
router.patch('/support/messages/:id', can('support:manage'), validate(messageUpdateSchema), support.updateMessage);
router.get('/support/tickets', can('support:manage'), validate(ticketListQuery, 'query'), support.listTickets);
router.get('/support/tickets/:id', can('support:manage'), support.getTicket);
router.patch('/support/tickets/:id', can('support:manage'), validate(ticketUpdateSchema), support.updateTicket);
router.post('/support/tickets/:id/notes', can('support:manage'), validate(ticketNoteSchema), support.addTicketNote);

// Chatbot (what the owner teaches it + questions it could not answer)
router.get('/chatbot/knowledge', can('chatbot:manage'), chatbot.listKnowledge);
router.post('/chatbot/knowledge', can('chatbot:manage'), validate(knowledgeSchema), chatbot.createKnowledge);
router.patch('/chatbot/knowledge/:id', can('chatbot:manage'), validate(knowledgeUpdateSchema), chatbot.updateKnowledge);
router.delete('/chatbot/knowledge/:id', can('chatbot:manage'), chatbot.deleteKnowledge);
router.get('/chatbot/unanswered', can('chatbot:manage'), chatbot.listUnanswered);
router.delete('/chatbot/unanswered/:id', can('chatbot:manage'), chatbot.deleteUnanswered);

// FAQ (website content)
router.get('/faqs', can('content:manage'), faqs.listAdmin);
router.post('/faqs', can('content:manage'), validate(faqSchema), faqs.createFaq);
router.post('/faqs/reorder', can('content:manage'), validate(faqReorderSchema), faqs.reorder);
router.patch('/faqs/:id', can('content:manage'), validate(faqUpdateSchema), faqs.updateFaq);
router.delete('/faqs/:id', can('content:manage'), faqs.deleteFaq);

// Reviews
router.get('/reviews', can('reviews:moderate'), validate(reviewListQuery, 'query'), reviews.listAdmin);
router.patch('/reviews/:id', can('reviews:moderate'), validate(reviewUpdateSchema), reviews.updateAdmin);
router.delete('/reviews/:id', can('reviews:moderate'), reviews.deleteAdmin);
router.post('/reviews/recalculate', can('reviews:moderate'), reviews.recalculate);

// Marketing: coupons
router.get('/coupons', can('marketing:manage'), validate(couponListQuery, 'query'), coupons.list);
router.post('/coupons', can('marketing:manage'), validate(couponCreateSchema), coupons.create);
router.patch('/coupons/:id', can('marketing:manage'), validate(couponUpdateSchema), coupons.update);
router.delete('/coupons/:id', can('marketing:manage'), coupons.remove);

// Newsletter subscribers
router.get('/subscribers', can('marketing:manage'), validate(subscriberListQuery, 'query'), subscribers.list);
router.patch('/subscribers/:id/status', can('marketing:manage'), validate(subscriberStatusSchema), subscribers.updateStatus);
router.delete('/subscribers/:id', can('marketing:manage'), subscribers.remove);

// Marketing campaigns (draft, scheduling, audience preview and Gmail SMTP sending)
router.get('/campaigns', can('marketing:manage'), validate(campaignListQuery, 'query'), campaigns.list);
router.post('/campaigns', can('marketing:manage'), validate(campaignCreateSchema), campaigns.create);
router.patch('/campaigns/:id', can('marketing:manage'), validate(campaignUpdateSchema), campaigns.update);
router.post('/campaigns/:id/preview', can('marketing:manage'), campaigns.preview);
router.post('/campaigns/:id/cancel', can('marketing:manage'), campaigns.cancel);
router.post('/campaigns/:id/send', can('marketing:manage'), validate(campaignSendSchema), campaigns.send);

// Ads / promotions
router.get('/ads', can('ads:manage'), validate(adListQuery, 'query'), ads.listAdmin);
router.get('/ads/analytics', can('ads:manage'), validate(adAnalyticsQuery, 'query'), ads.analytics);
router.post('/ads', can('ads:manage'), validate(adCreateSchema), ads.create);
router.patch('/ads/:id', can('ads:manage'), validate(adUpdateSchema), ads.update);
router.delete('/ads/:id', can('ads:manage'), ads.remove);

// Notifications (each admin sees only what their permissions allow)
router.get('/notifications', validate(notificationListQuery, 'query'), notifications.listNotifications);
router.post('/notifications/read', validate(markReadSchema), notifications.markRead);

// Cloudinary signed uploads (any admin who edits content that has images)
router.post(
  '/uploads/sign',
  canAny('categories:write', 'products:write', 'content:manage', 'ads:manage', 'reviews:moderate'),
  validate(uploadSignSchema),
  uploads.signUpload
);

export default router;
