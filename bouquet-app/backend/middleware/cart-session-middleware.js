import { randomUUID } from 'crypto';

export default function cartSessionMiddleware(req, res, next) {
    let sessionId = req.cookies?.cart_sid;

    if (!sessionId) {
        sessionId = randomUUID();
        res.cookie('cart_sid', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // true in production pe HTTPS
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 zile
        });
    }

    req.cartSessionId = sessionId;
    next();
}