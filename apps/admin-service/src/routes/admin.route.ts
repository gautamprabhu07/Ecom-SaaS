//Path: apps/admin-service/src/routes/admin.route.ts
import express, {Router} from 'express';
import { getAllProducts, getAllEvents, getAllAdmins, getAllCustomizations, getAllSellers, getAllUsers, addNewAdmin} from '../controllers/admin.controller';
import { chatWithAnalyticsAssistant } from '../controllers/ai-chat.controller';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import { isAdmin } from '@packages/middleware/authorizeRoles';
import { createAnalyticsHandlers, platformScope } from '@packages/libs/analytics/handlers';

const router:Router = express.Router();
router.get('/get-all-products', isAuthenticated, isAdmin, getAllProducts);
router.get('/get-all-events', isAuthenticated, isAdmin, getAllEvents);
router.get('/get-all-admins', isAuthenticated, isAdmin, getAllAdmins);
router.get('/get-all-customizations',getAllCustomizations);
router.get('/get-all-sellers', isAuthenticated, isAdmin, getAllSellers);
router.get('/get-all-users', isAuthenticated, isAdmin, getAllUsers);
router.post('/add-new-admin', isAuthenticated, isAdmin, addNewAdmin);
router.post('/ai-chat', isAuthenticated, isAdmin, chatWithAnalyticsAssistant);

//dashboard analytics for the whole platform
const analytics = createAnalyticsHandlers(platformScope);
router.get('/analytics/summary', isAuthenticated, isAdmin, analytics.summary);
router.get('/analytics/revenue', isAuthenticated, isAdmin, analytics.revenue);
router.get('/analytics/devices', isAuthenticated, isAdmin, analytics.devices);
router.get('/analytics/geography', isAuthenticated, isAdmin, analytics.geography);
router.get('/analytics/funnel', isAuthenticated, isAdmin, analytics.funnel);
router.get('/analytics/top-products', isAuthenticated, isAdmin, analytics.topProducts);
router.get('/analytics/recent-orders', isAuthenticated, isAdmin, analytics.recentOrders);

export default router;