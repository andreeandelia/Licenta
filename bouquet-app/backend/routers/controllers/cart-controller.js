import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getOwnerWhere(req) {
    if (req.userId) return { userId: req.userId };
    if (req.cartSessionId) return { sessionId: req.cartSessionId };
    return null;
}

function mapBouquetDetails(bouquet) {
    const safeItems = Array.isArray(bouquet?.items) ? bouquet.items : [];

    const flowers = [];
    const accessories = [];
    let wrapping = null;

    safeItems.forEach((entry) => {
        const product = entry?.product;
        if (!product) return;

        const mapped = {
            id: product.id,
            name: product.name,
            price: Number(entry.priceSnapshot || product.price || 0),
            qty: Number(entry.quantity || 1),
        };

        if (product.type === 'FLOWER') {
            flowers.push(mapped);
            return;
        }

        if (product.type === 'ACCESSORY') {
            accessories.push(mapped);
            return;
        }

        if (product.type === 'WRAPPING' && !wrapping) {
            wrapping = {
                id: mapped.id,
                name: mapped.name,
                price: mapped.price,
            };
        }
    });

    return { flowers, accessories, wrapping };
}

function normalizeBouquetPayload(input) {
    const bouquet = input || {};

    const flowers = Array.isArray(bouquet.flowers) ? bouquet.flowers : [];
    const accessories = Array.isArray(bouquet.accessories) ? bouquet.accessories : [];
    const wrapping = bouquet.wrapping && typeof bouquet.wrapping === 'object' ? bouquet.wrapping : null;

    const normalizeItem = (item) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        price: Number(item.price) || 0,
        qty: Math.max(1, Number(item.qty) || 1),
    });

    return {
        flowers: flowers.map(normalizeItem),
        accessories: accessories.map(normalizeItem),
        wrapping: wrapping
            ? {
                id: String(wrapping.id || ''),
                name: String(wrapping.name || ''),
                price: Number(wrapping.price) || 0,
            }
            : null,
    };
}

function computeTotal(bouquet) {
    const flowersTotal = bouquet.flowers.reduce((sum, item) => sum + item.price * item.qty, 0);
    const accessoriesTotal = bouquet.accessories.reduce((sum, item) => sum + item.price * item.qty, 0);
    const wrappingTotal = bouquet.wrapping ? bouquet.wrapping.price : 0;
    return Number((flowersTotal + accessoriesTotal + wrappingTotal).toFixed(2));
}

async function createBouquetFromPayload(rawBouquet) {
    const bouquet = normalizeBouquetPayload(rawBouquet);
    const hasAnyItems = bouquet.flowers.length > 0 || bouquet.accessories.length > 0 || Boolean(bouquet.wrapping);

    if (!hasAnyItems) {
        throw new Error('Bouquet is empty');
    }

    const lineItems = [
        ...bouquet.flowers.map((item) => ({ ...item, type: 'FLOWER' })),
        ...bouquet.accessories.map((item) => ({ ...item, type: 'ACCESSORY' })),
        ...(bouquet.wrapping ? [{ ...bouquet.wrapping, qty: 1, type: 'WRAPPING' }] : []),
    ];

    const productIds = [...new Set(lineItems.map((item) => item.id).filter(Boolean))];
    if (productIds.length === 0) throw new Error('Bouquet has no valid products');

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, type: true },
    });
    const productById = new Map(products.map((entry) => [entry.id, entry]));

    const invalidTypeItem = lineItems.find((item) => {
        const product = productById.get(item.id);
        if (!product) return true;
        return product.type !== item.type;
    });

    if (invalidTypeItem) {
        throw new Error('Invalid bouquet product selection');
    }

    const bouquetTotal = computeTotal(bouquet);

    return prisma.bouquet.create({
        data: {
            price: bouquetTotal,
            items: {
                create: lineItems.map((item) => ({
                    productId: item.id,
                    quantity: Math.max(1, Math.floor(Number(item.qty) || 1)),
                    priceSnapshot: Number(item.price) || 0,
                })),
            },
        },
        select: { id: true, price: true },
    });
}

async function getCart(req, res, next) {
    try {
        const ownerWhere = getOwnerWhere(req);
        if (!ownerWhere) return res.status(400).json({ error: 'Cart owner not found' });

        const items = await prisma.cartItems.findMany({
            where: ownerWhere,
            include: {
                bouquet: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true,
                                        price: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
        const count = items.reduce((sum, item) => sum + item.quantity, 0);

        return res.json({
            items: items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                bouquetDetails: mapBouquetDetails(item.bouquet),
            })),
            count,
            total: Number(total.toFixed(2)),
        });
    } catch (err) {
        next(err);
    }
}

async function addToCart(req, res, next) {
    try {
        const ownerWhere = getOwnerWhere(req);
        if (!ownerWhere) return res.status(400).json({ error: 'Cart owner not found' });

        let bouquetId = String(req.body?.bouquetId || '').trim();
        const quantity = Math.max(1, Math.floor(Number(req.body?.quantity) || 1));

        let bouquet = null;

        if (bouquetId) {
            bouquet = await prisma.bouquet.findUnique({
                where: { id: bouquetId },
                select: { id: true, price: true },
            });
            if (!bouquet) return res.status(404).json({ error: 'Bouquet not found' });
        } else {
            try {
                bouquet = await createBouquetFromPayload(req.body?.bouquet);
            } catch (err) {
                return res.status(400).json({ error: err.message || 'Invalid bouquet payload' });
            }
            bouquetId = bouquet.id;
        }

        const existing = await prisma.cartItems.findFirst({
            where: {
                ...ownerWhere,
                bouquetId,
            },
            select: { id: true, quantity: true },
        });

        let item;

        if (existing) {
            item = await prisma.cartItems.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity },
                include: {
                    bouquet: {
                        select: { id: true, price: true },
                    },
                },
            });
        } else {
            item = await prisma.cartItems.create({
                data: {
                    ...ownerWhere,
                    bouquetId,
                    quantity,
                    unitPrice: Number(bouquet?.price || 0),
                },
                include: {
                    bouquet: {
                        select: { id: true, price: true },
                    },
                },
            });
        }

        return res.status(201).json({
            item: {
                ...item,
                unitPrice: Number(item.unitPrice),
            },
        });
    } catch (err) {
        next(err);
    }
}

async function updateCartQuantity(req, res, next) {
    try {
        const ownerWhere = getOwnerWhere(req);
        if (!ownerWhere) return res.status(400).json({ error: 'Cart owner not found' });

        const id = String(req.params.id || '');
        const quantity = Number(req.body?.quantity);

        if (!id) return res.status(400).json({ error: 'Invalid cart item id' });
        if (!Number.isFinite(quantity)) return res.status(400).json({ error: 'quantity must be a number' });

        if (quantity < 1) {
            const removed = await prisma.cartItems.deleteMany({
                where: { id, ...ownerWhere },
            });

            if (removed.count === 0) return res.status(404).json({ error: 'Cart item not found' });
            return res.json({ ok: true, removed: true });
        }

        const updated = await prisma.cartItems.updateMany({
            where: { id, ...ownerWhere },
            data: { quantity: Math.floor(quantity) },
        });

        if (updated.count === 0) return res.status(404).json({ error: 'Cart item not found' });

        return res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

async function removeCartItem(req, res, next) {
    try {
        const ownerWhere = getOwnerWhere(req);
        if (!ownerWhere) return res.status(400).json({ error: 'Cart owner not found' });

        const id = String(req.params.id || '');
        if (!id) return res.status(400).json({ error: 'Invalid cart item id' });

        const removed = await prisma.cartItems.deleteMany({
            where: { id, ...ownerWhere },
        });

        if (removed.count === 0) return res.status(404).json({ error: 'Cart item not found' });
        return res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

export { getCart, addToCart, updateCartQuantity, removeCartItem };