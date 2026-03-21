import express from 'express';
import requireAuth from '../middleware/auth-middleware.js';
import optionalAuth from '../middleware/optional-auth-middleware.js';
import cartSessionMiddleware from '../middleware/cart-session-middleware.js';
import {
    createCashOnDeliveryOrder,
    createOnlinePaymentOrder,
    listOrders,
    cancelOrder,
} from './controllers/order-controller.js';

const router = express.Router();

router.get('/', requireAuth, listOrders);
router.post('/cash-on-delivery', cartSessionMiddleware, optionalAuth, createCashOnDeliveryOrder);
router.post('/online/init', cartSessionMiddleware, optionalAuth, createOnlinePaymentOrder);
router.delete('/:id/cancel', requireAuth, cancelOrder);

export default router;
