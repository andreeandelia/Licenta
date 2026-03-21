import express from 'express';
import requireAuth from '../middleware/auth-middleware.js';
import requireAdmin from '../middleware/admin-middleware.js';
import { getDashboardStats } from './controllers/admin-controller.js';

const router = express.Router();

router.get('/dashboard', requireAuth, requireAdmin, getDashboardStats);

export default router;
