import express from 'express';
import {
    getCart,
    addToCart,
    updateCartQuantity,
    removeCartItem,
} from './controllers/cart-controller.js';
import cartSessionMiddleware from '../middleware/cart-session-middleware.js';

const router = express.Router();

router.use(cartSessionMiddleware);
router.get('/', getCart);
router.post('/add', addToCart);
router.patch('/:id/quantity', updateCartQuantity);
router.delete('/:id', removeCartItem);

export default router;