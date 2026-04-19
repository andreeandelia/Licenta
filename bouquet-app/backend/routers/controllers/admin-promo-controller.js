import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
}

function parseDateOnly(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const parsed = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed;
}

function formatDateOnly(value) {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
}

function normalizeBoolean(value, fallback = true) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;

    const normalized = String(value).trim().toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(normalized);
}

function isWithinDateRange(promo, now = new Date()) {
    if (!promo.startDate || !promo.endDate) return false;
    return promo.startDate <= now && promo.endDate >= now;
}

function toPromoResponse(promo) {
    const isCurrentlyActive = Boolean(promo.isActive && isWithinDateRange(promo));

    return {
        id: promo.id,
        code: promo.code,
        discountPercent: Number(promo.discountPercent || 0),
        startDate: formatDateOnly(promo.startDate),
        endDate: formatDateOnly(promo.endDate),
        isActive: Boolean(promo.isActive),
        status: isCurrentlyActive ? 'Active' : 'Inactive',
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
    };
}

function resolvePromoPayload(payload = {}, existingPromo = null) {
    const codeSource = payload.code !== undefined ? payload.code : existingPromo?.code;
    const discountSource = payload.discountPercent !== undefined ? payload.discountPercent : existingPromo?.discountPercent;
    const startDateSource = payload.startDate !== undefined ? payload.startDate : existingPromo?.startDate;
    const endDateSource = payload.endDate !== undefined ? payload.endDate : existingPromo?.endDate;

    const code = normalizeCode(codeSource);
    const discountPercent = Number(discountSource);
    const startDate = parseDateOnly(startDateSource);
    const endDate = parseDateOnly(endDateSource);
    const isActive = normalizeBoolean(
        payload.isActive,
        existingPromo ? Boolean(existingPromo.isActive) : true,
    );

    if (!code) {
        return { error: 'Promo code is required' };
    }

    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent >= 100) {
        return { error: 'Discount must be a number between 0 and 100' };
    }

    if (!startDate) {
        return { error: 'Start date is required' };
    }

    if (!endDate) {
        return { error: 'End date is required' };
    }

    if (endDate < startDate) {
        return { error: 'End date must be on or after start date' };
    }

    return {
        data: {
            code,
            discountPercent,
            startDate,
            endDate,
            isActive,
        },
    };
}

export async function listAdminPromoCodes(req, res, next) {
    try {
        const promoCodes = await prisma.promoCode.findMany({
            orderBy: { code: 'asc' },
        });

        return res.json({
            items: promoCodes.map(toPromoResponse),
        });
    } catch (err) {
        return next(err);
    }
}

export async function createAdminPromoCode(req, res, next) {
    try {
        const parsed = resolvePromoPayload(req.body);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const existing = await prisma.promoCode.findUnique({
            where: { code: parsed.data.code },
            select: { id: true },
        });

        if (existing) {
            return res.status(409).json({ error: 'Promo code already exists' });
        }

        const promo = await prisma.promoCode.create({
            data: parsed.data,
        });

        return res.status(201).json({
            item: toPromoResponse(promo),
        });
    } catch (err) {
        return next(err);
    }
}

export async function updateAdminPromoCode(req, res, next) {
    try {
        const id = String(req.params.id || '').trim();
        if (!id) {
            return res.status(400).json({ error: 'Promo code ID is required' });
        }

        const existing = await prisma.promoCode.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Promo code not found' });
        }

        const parsed = resolvePromoPayload(req.body, existing);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        if (parsed.data.code !== existing.code) {
            const duplicate = await prisma.promoCode.findUnique({
                where: { code: parsed.data.code },
                select: { id: true },
            });

            if (duplicate && duplicate.id !== existing.id) {
                return res.status(409).json({ error: 'Promo code already exists' });
            }
        }

        const promo = await prisma.promoCode.update({
            where: { id },
            data: parsed.data,
        });

        return res.json({
            item: toPromoResponse(promo),
        });
    } catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Promo code not found' });
        }

        return next(err);
    }
}

export async function deleteAdminPromoCode(req, res, next) {
    try {
        const id = String(req.params.id || '').trim();
        if (!id) {
            return res.status(400).json({ error: 'Promo code ID is required' });
        }

        await prisma.promoCode.delete({
            where: { id },
        });

        return res.status(204).send();
    } catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Promo code not found' });
        }

        return next(err);
    }
}