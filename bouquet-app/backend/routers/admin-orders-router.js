import express from 'express';
import requireAuth from '../middleware/auth-middleware.js';
import requireAdmin from '../middleware/admin-middleware.js';
import {
    listAdminOrders,
    getAdminOrder,
    updateAdminOrderStatus,
} from './controllers/admin-orders-controller.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, listAdminOrders);
router.get('/:id', requireAuth, requireAdmin, getAdminOrder);
router.patch('/:id/status', requireAuth, requireAdmin, updateAdminOrderStatus);

export default router;
