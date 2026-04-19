import express from 'express';
import requireAuth from '../middleware/auth-middleware.js';
import requireAdmin from '../middleware/admin-middleware.js';
import {
    createAdminPromoCode,
    deleteAdminPromoCode,
    listAdminPromoCodes,
    updateAdminPromoCode,
} from './controllers/admin-promo-controller.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, listAdminPromoCodes);
router.post('/', requireAuth, requireAdmin, createAdminPromoCode);
router.patch('/:id', requireAuth, requireAdmin, updateAdminPromoCode);
router.delete('/:id', requireAuth, requireAdmin, deleteAdminPromoCode);

export default router;