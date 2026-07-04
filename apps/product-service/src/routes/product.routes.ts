import express, { Router } from 'express';
const router: Router = express.Router();
import {getProductCategories, getDiscountCodes, createDiscountCode, deleteDiscountCode} from '../controllers/product.controller';
import  isAuthenticated from '@packages/middleware/isAuthenticated';

router.get('/get-categories', getProductCategories);
router.post('/create-discount-code', isAuthenticated ,createDiscountCode);
router.get('/get-discount-codes', getDiscountCodes);
router.delete('/delete-discount-code/:id', isAuthenticated, deleteDiscountCode);
export default router;