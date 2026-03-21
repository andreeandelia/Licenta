import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseBool(v) {
    return v === "1" || v === "true";
}

function parseColors(str) {
    if (!str) return null;
    return str.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
}

async function listProducts(req, res, next) {
    try {
        const type = String(req.query.type || "").toUpperCase();
        const colors = parseColors(req.query.colors);
        const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : null;
        const inStock = parseBool(req.query.inStock);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 6, 1), 24);

        const where = {};

        if (type) where.type = type;

        if (colors && colors.length > 0) {
            where.color = {
                in: colors
            }
        }

        if (minPrice != null || maxPrice != null) {
            where.price = {};
            if (minPrice != null && !Number.isNaN(minPrice)) where.price.gte = minPrice;
            if (maxPrice != null && !Number.isNaN(maxPrice)) where.price.lte = maxPrice;
        }

        if (inStock) {
            where.stock = {
                gt: 0
            }
        }

        const skip = (page - 1) * pageSize;

        const [total, items] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    price: true,
                    color: true,
                    stock: true,
                    imageUrl: true
                }
            })
        ]);

        const normalized = items.map((p) => ({
            ...p,
            price: Number(p.price)
        }))

        res.json({
            items: normalized,
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize))
        });
    }
    catch (err) {
        next(err);
    }
}

export { listProducts };