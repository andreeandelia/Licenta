import express from 'express'
import { register, login, me, updateProfile, logout } from './controllers/auth-controller.js'
import requireAuth from '../middleware/auth-middleware.js'

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.post('/logout', logout);

export default router;