import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeCode(raw) {
    return String(raw || '').trim().toUpperCase();
}

function formatPromoCode(promo) {
    return {
        code: promo.code,
        discountPercent: Number(promo.discountPercent || 0),
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 10) : '',
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 10) : '',
    };
}

function isPromoCurrentlyActive(promo, now = new Date()) {
    if (!promo?.isActive) return false;
    if (!promo.startDate || !promo.endDate) return false;
    return promo.startDate <= now && promo.endDate >= now;
}

async function getAvailablePromoCodes(req, res, next) {
    try {
        const promoCodes = await prisma.promoCode.findMany({
            where: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
            },
            orderBy: { code: 'asc' },
            select: {
                code: true,
                discountPercent: true,
                startDate: true,
                endDate: true,
            },
        });

        return res.json({
            codes: promoCodes.map(formatPromoCode),
        });
    } catch (err) {
        next(err);
    }
}

async function validatePromoCode(req, res, next) {
    try {
        const code = normalizeCode(req.body?.code || req.query?.code);
        if (!code) return res.status(400).json({ error: 'Promo code is required' });

        const promo = await prisma.promoCode.findUnique({
            where: { code },
            select: {
                code: true,
                discountPercent: true,
                isActive: true,
                startDate: true,
                endDate: true,
            },
        });

        if (!promo || !isPromoCurrentlyActive(promo)) {
            return res.status(404).json({ error: 'Invalid promo code' });
        }

        const discountPercent = Number(promo.discountPercent || 0);
        if (discountPercent <= 0 || discountPercent >= 100) {
            return res.status(400).json({ error: 'Promo code is not valid' });
        }

        return res.json({
            promo: {
                code: promo.code,
                discountPercent,
            },
        });
    } catch (err) {
        next(err);
    }
}

export { getAvailablePromoCodes, validatePromoCode };
