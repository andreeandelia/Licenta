import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRouter from '../routers/auth-router.js'
import productRouter from '../routers/product-router.js'
import wishlistRouter from '../routers/wishlist-router.js'

dotenv.config()

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/wishlist', wishlistRouter);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
})

export default app;