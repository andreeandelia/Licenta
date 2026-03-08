import express from 'express';
import requireAuth from '../middleware/auth-middleware.js';
import {
    listWishlist,
    addWishlistItem,
    updateWishlistTitle,
    deleteWishlistItem,
    clearWishlist,
} from './controllers/wishlist-controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', listWishlist);
router.post('/', addWishlistItem);
router.patch('/:id/title', updateWishlistTitle);
router.delete('/:id', deleteWishlistItem);
router.delete('/', clearWishlist);

export default router;
