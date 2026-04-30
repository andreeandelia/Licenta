import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import authRouter from '../routers/auth-router.js'
import productRouter from '../routers/product-router.js'
import wishlistRouter from '../routers/wishlist-router.js'
import cartRouter from '../routers/cart-router.js'
import promoRouter from '../routers/promo-router.js'
import orderRouter from '../routers/order-router.js'
import adminRouter from '../routers/admin-router.js'
import chatRouter from '../routers/chat-router.js'
import optionalAuth from '../middleware/optional-auth-middleware.js'
import { handleStripeWebhook } from '../routers/controllers/order-controller.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const prisma = new PrismaClient();

// Fix #10: Handle Prisma errors and disconnection
prisma.$on('error', (e) => {
    console.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
    console.warn('Prisma warning:', e);
});

// Fix #11: CORS with environment variable support
const getAllowedOrigins = () => {
    const envOrigins = process.env.CORS_ORIGINS || 'http://localhost:5173';
    return envOrigins.split(',').map(origin => origin.trim());
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile, curl, etc)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS not allowed for origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/api/orders/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(cookieParser());

const uploadsRoot = path.join(process.cwd(), 'uploads');
fs.mkdirSync(path.join(uploadsRoot, 'products'), { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

// routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/cart', optionalAuth, cartRouter);
app.use('/api/promos', promoRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);

// Fix #10: Health check endpoint for monitoring
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: err.message || 'Database connection failed',
            timestamp: new Date().toISOString(),
        });
    }
});

app.use((err, req, res, next) => {
    if (err?.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image size must be up to 5MB' });
        }

        return res.status(400).json({ error: err.message || 'Invalid uploaded file' });
    }

    if (err?.message === 'Only JPG, PNG, and WEBP images are allowed') {
        return res.status(400).json({ error: err.message });
    }

    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

export default app;
export { prisma };