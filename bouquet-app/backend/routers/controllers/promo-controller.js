import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeCode(raw) {
    return String(raw || '').trim().toUpperCase();
}

function formatPromoCode(promo) {
    return {
        code: promo.code,
        discountPercent: Number(promo.discountPercent || 0),
    };
}

async function getAvailablePromoCodes(req, res, next) {
    try {
        const promoCodes = await prisma.promoCode.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
            select: {
                code: true,
                discountPercent: true,
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
            },
        });

        if (!promo || !promo.isActive) {
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
