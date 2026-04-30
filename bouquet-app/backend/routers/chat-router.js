import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { chatWithFlorist } from './controllers/chat-controller.js'

const router = express.Router();

// Fix #9: Rate limiting to prevent API abuse and quota exhaustion
const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute window
    max: 10,  // 10 requests per minute
    keyGenerator: (req, res) => {
        // Use user ID if authenticated, otherwise session ID or IP (with IPv6 support)
        return req.userId || req.sessionId || ipKeyGenerator(req);
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many chat requests. Please wait a moment before trying again.',
            retryAfter: '1 minute',
        });
    },
    skip: (req, res) => {
        // Skip rate limiting for admin users
        return req.isAdmin === true;
    },
});

router.post('/', chatLimiter, chatWithFlorist);

export default router;
