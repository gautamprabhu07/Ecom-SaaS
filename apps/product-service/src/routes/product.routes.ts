//Path: apps/product-service/src/routes/product.routes.ts
import express, { Router } from 'express';
const router: Router = express.Router();
import {getProductCategories, getDiscountCodes, createDiscountCode, deleteDiscountCode, uploadProductImage, deleteProductImage} from '../controllers/product.controller';
import  isAuthenticated from '@packages/middleware/isAuthenticated';

router.get('/get-categories', getProductCategories);
router.post('/create-discount-code', isAuthenticated ,createDiscountCode);
router.get('/get-discount-codes', isAuthenticated, getDiscountCodes);
router.delete('/delete-discount-code/:id', isAuthenticated, deleteDiscountCode);
router.post('/upload-product-image', isAuthenticated, uploadProductImage);
router.delete('/delete-product-image', isAuthenticated, deleteProductImage);

export default router;