import express from 'express';
import {
    getAvailablePromoCodes,
    validatePromoCode,
} from './controllers/promo-controller.js';

const router = express.Router();

router.get('/', getAvailablePromoCodes);
router.post('/validate', validatePromoCode);

export default router;
