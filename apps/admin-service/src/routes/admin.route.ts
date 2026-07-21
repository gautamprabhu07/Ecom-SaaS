//Path: apps/admin-service/src/routes/admin.route.ts
import express, {Router} from 'express';
import { getAllProducts, getAllEvents, getAllAdmins, getAllCustomizations, getAllSellers, getAllUsers, addNewAdmin} from '../controllers/admin.controller';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import { isAdmin } from '@packages/middleware/authorizeRoles';

const router:Router = express.Router();
router.get('/get-all-products', isAuthenticated, isAdmin, getAllProducts);
router.get('/get-all-events', isAuthenticated, isAdmin, getAllEvents);
router.get('/get-all-admins', isAuthenticated, isAdmin, getAllAdmins);
router.get('/get-all-customizations',getAllCustomizations);
router.get('/get-all-sellers', isAuthenticated, isAdmin, getAllSellers);
router.get('/get-all-users', isAuthenticated, isAdmin, getAllUsers);
router.post('/add-new-admin', isAuthenticated, isAdmin, addNewAdmin);

export default router;