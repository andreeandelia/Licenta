import express from 'express'
import { register, verify, login, loginWithGoogle, forgotPassword, resetPassword, me, updateProfile, logout, deleteAccount } from './controllers/auth-controller.js'
import requireAuth from '../middleware/auth-middleware.js'

const router = express.Router();

router.post('/register', register);
router.get('/verify', verify);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.delete('/account', requireAuth, deleteAccount);
router.post('/logout', logout);

export default router;