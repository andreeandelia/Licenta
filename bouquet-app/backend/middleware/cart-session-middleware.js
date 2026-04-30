import { randomUUID, createHmac } from 'crypto';

// Fix #5: Session fixation prevention via HMAC signing
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-insecure-secret-change-in-prod';

function signSessionId(sessionId) {
    return createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
}

function verifySessionId(sessionId, signature) {
    const expectedSignature = signSessionId(sessionId);
    // Constant-time comparison to prevent timing attacks
    return expectedSignature === signature;
}

export default function cartSessionMiddleware(req, res, next) {
    let sessionId = req.cookies?.cart_sid;
    let sessionSignature = req.cookies?.cart_sid_sig;

    if (!sessionId || !sessionSignature || !verifySessionId(sessionId, sessionSignature)) {
        // Create new session
        sessionId = randomUUID();
        sessionSignature = signSessionId(sessionId);

        res.cookie('cart_sid', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });

        res.cookie('cart_sid_sig', sessionSignature, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });
    }

    req.cartSessionId = sessionId;
    next();
}