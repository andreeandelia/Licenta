import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const TREND_MONTHS = 6;
const DELIVERED_STATUS = 'DELIVERED';
const VALID_OVERVIEW_STATUSES = [
    'CONFIRMED',
    'IN_PREPARATION',
    'READY_FOR_DELIVERY',
    'IN_DELIVERY',
    'DELIVERED',
];
const PRODUCT_TYPES = new Set(['FLOWER', 'WRAPPING', 'ACCESSORY']);
const PRODUCT_COLORS = new Set([
    'PINK',
    'RED',
    'WHITE',
    'YELLOW',
    'PURPLE',
    'BROWN',
    'CLEAR',
    'GOLD',
    'SILVER',
]);

function round2(value) {
    return Number(Number(value || 0).toFixed(2));
}

function monthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function monthKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}`;
}

function buildRecentMonths(count) {
    const now = new Date();
    const currentMonth = monthStart(now);
    const months = [];

    for (let index = count - 1; index >= 0; index -= 1) {
        const month = new Date(currentMonth);
        month.setMonth(currentMonth.getMonth() - index);
        months.push(month);
    }

    return months;
}

function growthPercent(previousValue, currentValue) {
    const prev = Number(previousValue || 0);
    const curr = Number(currentValue || 0);

    if (prev <= 0 && curr <= 0) return 0;
    if (prev <= 0) return 100;

    return round2(((curr - prev) / prev) * 100);
}

function toCategoryLabel(type) {
    if (type === 'FLOWER') return 'Flowers';
    if (type === 'WRAPPING') return 'Wrapping';
    if (type === 'ACCESSORY') return 'Accessories';
    return 'Other';
}

function toProductResponse(product) {
    return {
        id: product.id,
        name: product.name,
        type: product.type,
        price: Number(product.price),
        stock: product.stock,
        color: product.color,
        imageUrl: product.imageUrl,
        description: product.description,
    };
}

function buildUploadedImageUrl(file) {
    if (!file?.filename) return '';
    return `/uploads/products/${file.filename}`;
}

async function removeUploadedFile(file) {
    if (!file?.path) return;
    try {
        await fs.unlink(file.path);
    } catch {
        // noop
    }
}

async function removeStoredUpload(imageUrl) {
    const normalized = String(imageUrl || '');
    if (!normalized.startsWith('/uploads/products/')) return;

    const absolutePath = path.join(process.cwd(), normalized.replace(/^\//, ''));
    try {
        await fs.unlink(absolutePath);
    } catch {
        // noop
    }
}

function parseProductPayload(payload = {}, options = {}) {
    const name = String(payload.name || '').trim();
    const type = String(payload.type || '').toUpperCase();
    const imageUrl = String(options.imageUrl || '').trim();
    const requireImage = Boolean(options.requireImage);
    const descriptionRaw = payload.description == null ? '' : String(payload.description).trim();
    const colorRaw = payload.color == null ? '' : String(payload.color).trim().toUpperCase();
    const stock = Number(payload.stock);
    const price = Number(payload.price);

    if (!name) {
        return { error: 'Product name is required' };
    }

    if (!PRODUCT_TYPES.has(type)) {
        return { error: 'Invalid product type' };
    }

    if (!Number.isFinite(price) || price < 0) {
        return { error: 'Price must be a valid positive number' };
    }

    if (!Number.isInteger(stock) || stock < 0) {
        return { error: 'Stock must be a non-negative integer' };
    }

    if (requireImage && !imageUrl) {
        return { error: 'Product image is required' };
    }

    if (colorRaw && !PRODUCT_COLORS.has(colorRaw)) {
        return { error: 'Invalid color value' };
    }

    return {
        data: {
            name,
            type,
            price,
            stock,
            imageUrl,
            description: descriptionRaw || null,
            color: colorRaw || null,
        },
    };
}

export async function listAdminProducts(req, res, next) {
    try {
        const search = String(req.query.search || '').trim();
        const type = String(req.query.type || '').trim().toUpperCase();

        if (search.length > 100) {
            return res.status(400).json({ error: 'Search query must be at most 100 characters long' });
        }

        if (type && !PRODUCT_TYPES.has(type)) {
            return res.status(400).json({ error: 'Invalid product type filter' });
        }

        const where = {};

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (type) {
            where.type = type;
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                type: true,
                price: true,
                stock: true,
                color: true,
                imageUrl: true,
                description: true,
            },
        });

        return res.json({
            items: products.map(toProductResponse),
        });
    } catch (err) {
        return next(err);
    }
}

export async function createAdminProduct(req, res, next) {
    try {
        const parsed = parseProductPayload(req.body, {
            imageUrl: buildUploadedImageUrl(req.file),
            requireImage: true,
        });

        if (parsed.error) {
            await removeUploadedFile(req.file);
            return res.status(400).json({ error: parsed.error });
        }

        const product = await prisma.product.create({
            data: parsed.data,
            select: {
                id: true,
                name: true,
                type: true,
                price: true,
                stock: true,
                color: true,
                imageUrl: true,
                description: true,
            },
        });

        return res.status(201).json({
            item: toProductResponse(product),
        });
    } catch (err) {
        await removeUploadedFile(req.file);
        return next(err);
    }
}

export async function updateAdminProduct(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma.product.findUnique({
            where: { id },
            select: { id: true, imageUrl: true },
        });

        if (!existing) {
            await removeUploadedFile(req.file);
            return res.status(404).json({ error: 'Product not found' });
        }

        const parsed = parseProductPayload(req.body, {
            imageUrl: buildUploadedImageUrl(req.file) || existing.imageUrl,
            requireImage: true,
        });

        if (parsed.error) {
            await removeUploadedFile(req.file);
            return res.status(400).json({ error: parsed.error });
        }

        const product = await prisma.product.update({
            where: { id },
            data: parsed.data,
            select: {
                id: true,
                name: true,
                type: true,
                price: true,
                stock: true,
                color: true,
                imageUrl: true,
                description: true,
            },
        });

        if (req.file && existing.imageUrl && existing.imageUrl !== product.imageUrl) {
            await removeStoredUpload(existing.imageUrl);
        }

        return res.json({
            item: toProductResponse(product),
        });
    } catch (err) {
        await removeUploadedFile(req.file);
        return next(err);
    }
}

export async function deleteAdminProduct(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma.product.findUnique({
            where: { id },
            select: { id: true, imageUrl: true },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await prisma.product.delete({
            where: { id },
        });

        await removeStoredUpload(existing.imageUrl);

        return res.status(204).send();
    } catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (err?.code === 'P2003') {
            return res.status(409).json({
                error: 'Product cannot be deleted because it is used in bouquets',
            });
        }

        return next(err);
    }
}

export async function getDashboardStats(req, res, next) {
    try {
        const deliveredOrders = await prisma.order.findMany({
            where: { status: DELIVERED_STATUS },
            select: {
                id: true,
                createdAt: true,
                finalPrice: true,
                customerEmail: true,
                userId: true,
                lines: {
                    select: {
                        totalPrice: true,
                        quantity: true,
                        bouquet: {
                            select: {
                                items: {
                                    select: {
                                        quantity: true,
                                        priceSnapshot: true,
                                        product: {
                                            select: {
                                                type: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const validOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: VALID_OVERVIEW_STATUSES,
                },
            },
            select: {
                id: true,
                createdAt: true,
                customerEmail: true,
                userId: true,
            },
        });

        const totalRevenue = round2(
            deliveredOrders.reduce((sum, order) => sum + Number(order.finalPrice || 0), 0),
        );
        const deliveredOrdersCount = deliveredOrders.length;
        const avgOrderValue = deliveredOrdersCount > 0 ? round2(totalRevenue / deliveredOrdersCount) : 0;
        const totalOrders = validOrders.length;

        const uniqueCustomers = new Set();
        validOrders.forEach((order) => {
            const email = String(order.customerEmail || '').trim().toLowerCase();
            if (email) {
                uniqueCustomers.add(`email:${email}`);
                return;
            }

            if (order.userId) {
                uniqueCustomers.add(`user:${order.userId}`);
            }
        });
        const totalCustomers = uniqueCustomers.size;

        const recentMonths = buildRecentMonths(TREND_MONTHS);
        const monthRevenueMap = new Map();
        recentMonths.forEach((monthDate) => {
            monthRevenueMap.set(monthKey(monthDate), 0);
        });

        const customerSetsByMonth = new Map();
        recentMonths.forEach((monthDate) => {
            customerSetsByMonth.set(monthKey(monthDate), new Set());
        });

        deliveredOrders.forEach((order) => {
            const createdAt = new Date(order.createdAt);
            const key = monthKey(createdAt);

            if (!monthRevenueMap.has(key)) return;

            monthRevenueMap.set(
                key,
                monthRevenueMap.get(key) + Number(order.finalPrice || 0),
            );

        });

        validOrders.forEach((order) => {
            const createdAt = new Date(order.createdAt);
            const key = monthKey(createdAt);
            if (!customerSetsByMonth.has(key)) return;

            const email = String(order.customerEmail || '').trim().toLowerCase();
            if (email) {
                customerSetsByMonth.get(key).add(`email:${email}`);
            } else if (order.userId) {
                customerSetsByMonth.get(key).add(`user:${order.userId}`);
            }
        });

        const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' });

        const salesTrend = recentMonths.map((monthDate) => {
            const key = monthKey(monthDate);
            return {
                label: monthFormatter.format(monthDate),
                revenue: round2(monthRevenueMap.get(key) || 0),
            };
        });

        const currentMonthRevenue = salesTrend[salesTrend.length - 1]?.revenue || 0;
        const previousMonthRevenue = salesTrend[salesTrend.length - 2]?.revenue || 0;

        const currentMonthOrders = validOrders.filter((order) => {
            const createdAt = new Date(order.createdAt);
            const currentMonth = recentMonths[recentMonths.length - 1];
            return (
                createdAt.getFullYear() === currentMonth.getFullYear()
                && createdAt.getMonth() === currentMonth.getMonth()
            );
        }).length;

        const previousMonthOrders = validOrders.filter((order) => {
            const createdAt = new Date(order.createdAt);
            const previousMonth = recentMonths[recentMonths.length - 2];
            return (
                createdAt.getFullYear() === previousMonth.getFullYear()
                && createdAt.getMonth() === previousMonth.getMonth()
            );
        }).length;

        const currentMonthCustomerCount = customerSetsByMonth.get(
            monthKey(recentMonths[recentMonths.length - 1]),
        )?.size || 0;
        const previousMonthCustomerCount = customerSetsByMonth.get(
            monthKey(recentMonths[recentMonths.length - 2]),
        )?.size || 0;

        const categoryRevenue = {
            Flowers: 0,
            Wrapping: 0,
            Accessories: 0,
        };

        deliveredOrders.forEach((order) => {
            order.lines.forEach((line) => {
                const bouquetItems = Array.isArray(line?.bouquet?.items) ? line.bouquet.items : [];
                if (bouquetItems.length === 0) return;

                const lineTotal = Number(line.totalPrice || 0);
                if (lineTotal <= 0) return;

                const itemTotals = bouquetItems.map((item) => ({
                    type: item?.product?.type,
                    amount: Number(item.priceSnapshot || 0) * Number(item.quantity || 0),
                }));

                const bouquetTotal = itemTotals.reduce((sum, item) => sum + item.amount, 0);
                if (bouquetTotal <= 0) return;

                itemTotals.forEach((item) => {
                    const label = toCategoryLabel(item.type);
                    if (!Object.prototype.hasOwnProperty.call(categoryRevenue, label)) return;

                    const share = item.amount / bouquetTotal;
                    categoryRevenue[label] += lineTotal * share;
                });
            });
        });

        const salesByCategory = [
            { label: 'Flowers', revenue: round2(categoryRevenue.Flowers) },
            { label: 'Wrapping', revenue: round2(categoryRevenue.Wrapping) },
            { label: 'Accessories', revenue: round2(categoryRevenue.Accessories) },
        ];

        return res.json({
            summary: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                avgOrderValue,
                changes: {
                    revenuePct: growthPercent(previousMonthRevenue, currentMonthRevenue),
                    ordersPct: growthPercent(previousMonthOrders, currentMonthOrders),
                    customersPct: growthPercent(previousMonthCustomerCount, currentMonthCustomerCount),
                },
            },
            salesTrend,
            salesByCategory,
        });
    } catch (err) {
        next(err);
    }
}
