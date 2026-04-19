import express from 'express';
import requireAuth from '../middleware/auth-middleware.js';
import requireAdmin from '../middleware/admin-middleware.js';
import { uploadProductImage } from '../middleware/upload-middleware.js';
import {
    createAdminProduct,
    deleteAdminProduct,
    getDashboardStats,
    listAdminProducts,
    updateAdminProduct,
} from './controllers/admin-controller.js';
import adminOrdersRouter from './admin-orders-router.js';
import adminPromoRouter from './admin-promo-router.js';

const router = express.Router();

router.get('/dashboard', requireAuth, requireAdmin, getDashboardStats);
router.get('/products', requireAuth, requireAdmin, listAdminProducts);
router.post('/products', requireAuth, requireAdmin, uploadProductImage, createAdminProduct);
router.patch('/products/:id', requireAuth, requireAdmin, uploadProductImage, updateAdminProduct);
router.delete('/products/:id', requireAuth, requireAdmin, deleteAdminProduct);

router.use('/orders', adminOrdersRouter);
router.use('/promo-codes', adminPromoRouter);

export default router;
