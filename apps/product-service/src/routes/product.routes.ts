//Path: apps/product-service/src/routes/product.routes.ts
import express, { Router } from 'express';
const router: Router = express.Router();
import {getProductCategories, getDiscountCodes, createDiscountCode, deleteDiscountCode, uploadProductImage, deleteProductImage, createProduct, getShopProducts, deleteProduct, restoreProduct, getAllProducts, getProductDetails, getFilteredEvents, getFilteredProducts, getFilteredShops, searchProducts, topShops, followShop, unfollowShop, getAllEvents, getShopEvents, getSellerProductById, updateProduct} from '../controllers/product.controller';
import  isAuthenticated from '@packages/middleware/isAuthenticated';

router.get('/get-categories', getProductCategories);
router.post('/create-discount-code', isAuthenticated ,createDiscountCode);
router.get('/get-discount-codes', isAuthenticated, getDiscountCodes);
router.delete('/delete-discount-code/:id', isAuthenticated, deleteDiscountCode);
router.post('/upload-product-image', isAuthenticated, uploadProductImage);
router.delete('/delete-product-image', isAuthenticated, deleteProductImage);
router.post('/create-product', isAuthenticated, createProduct);
router.get('/get-shop-products', isAuthenticated, getShopProducts);
router.delete('/delete-product/:productId', isAuthenticated, deleteProduct);
router.put('/restore-product/:productId', isAuthenticated, restoreProduct);
router.get('/get-all-products', getAllProducts);
router.get('/get-all-events', getAllEvents);
router.get('/get-product/:slug', getProductDetails);
router.get('/get-filtered-offers', getFilteredEvents);
router.get('/get-filtered-products', getFilteredProducts);
router.get('/get-filtered-shops', getFilteredShops);
router.get('/search-products', searchProducts);
router.get('/top-shops', topShops);
router.post('/follow-shop', isAuthenticated, followShop);
router.post('/unfollow-shop', isAuthenticated, unfollowShop);
router.get('/get-shop-events', isAuthenticated, getShopEvents);
router.get('/get-seller-product/:productId', isAuthenticated, getSellerProductById);
router.put('/update-product/:productId', isAuthenticated, updateProduct);

export default router;