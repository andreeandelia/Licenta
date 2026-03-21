import jwt from 'jsonwebtoken';

export default function optionalAuth(req, res, next) {
    const token = req.cookies?.access_token;
    if (!token) {
        next();
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub;
    } catch {
        req.userId = null;
    }

    next();
}
