import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
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
})

export default app;