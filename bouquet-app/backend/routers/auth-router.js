import express from 'express'
import { register, verify, login, forgotPassword, resetPassword, me, updateProfile, logout } from './controllers/auth-controller.js'
import requireAuth from '../middleware/auth-middleware.js'

const router = express.Router();

router.post('/register', register);
router.get('/verify', verify);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.post('/logout', logout);

export default router;