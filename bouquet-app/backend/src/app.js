import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRouter from '../routers/auth-router.js'
import productRouter from '../routers/product-router.js'
import wishlistRouter from '../routers/wishlist-router.js'
import cartRouter from '../routers/cart-router.js'
import promoRouter from '../routers/promo-router.js'
import orderRouter from '../routers/order-router.js'
import adminRouter from '../routers/admin-router.js'
import optionalAuth from '../middleware/optional-auth-middleware.js'
import { handleStripeWebhook } from '../routers/controllers/order-controller.js'

dotenv.config()

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.post('/api/orders/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/cart', optionalAuth, cartRouter);
app.use('/api/promos', promoRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
})

export default app;