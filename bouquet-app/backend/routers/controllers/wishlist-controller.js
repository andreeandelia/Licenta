import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function deriveDefaultTitle(bouquet) {
    if (Array.isArray(bouquet?.flowers) && bouquet.flowers.length > 0) {
        return bouquet.flowers[0].name;
    }
    if (bouquet?.wrapping?.name) return bouquet.wrapping.name;
    if (Array.isArray(bouquet?.accessories) && bouquet.accessories.length > 0) {
        return bouquet.accessories[0].name;
    }
    return 'Custom Bouquet';
}

function normalizeBouquetPayload(input) {
    const bouquet = input || {};

    const flowers = Array.isArray(bouquet.flowers) ? bouquet.flowers : [];
    const accessories = Array.isArray(bouquet.accessories) ? bouquet.accessories : [];
    const wrapping = bouquet.wrapping && typeof bouquet.wrapping === 'object' ? bouquet.wrapping : null;
    const greetingCardMessage = String(bouquet.greetingCardMessage || '').trim().slice(0, 200);
    const hasGreetingCard = accessories.some((item) =>
        String(item?.name || '').trim().toLowerCase().includes('greeting card'),
    );

    const normalizeItem = (item) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        price: Number(item.price) || 0,
        qty: Math.max(1, Number(item.qty) || 1),
        imageUrl: String(item.imageUrl || ''),
    });

    return {
        flowers: flowers.map(normalizeItem),
        accessories: accessories.map(normalizeItem),
        wrapping: wrapping
            ? {
                id: String(wrapping.id || ''),
                name: String(wrapping.name || ''),
                price: Number(wrapping.price) || 0,
                imageUrl: String(wrapping.imageUrl || ''),
            }
            : null,
        greetingCardMessage: hasGreetingCard ? greetingCardMessage : '',
    };
}

function computeTotal(bouquet) {
    const flowersTotal = bouquet.flowers.reduce((sum, item) => sum + item.price * item.qty, 0);
    const accessoriesTotal = bouquet.accessories.reduce((sum, item) => sum + item.price * item.qty, 0);
    const wrappingTotal = bouquet.wrapping ? bouquet.wrapping.price : 0;
    return Number((flowersTotal + accessoriesTotal + wrappingTotal).toFixed(2));
}

async function listWishlist(req, res, next) {
    try {
        const items = await prisma.wishlistItem.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                bouquet: true,
                totalPrice: true,
                createdAt: true,
            },
        });

        res.json({
            items: items.map((item) => ({
                ...item,
                totalPrice: Number(item.totalPrice),
            })),
        });
    } catch (err) {
        next(err);
    }
}

async function addWishlistItem(req, res, next) {
    try {
        const bouquet = normalizeBouquetPayload(req.body?.bouquet);
        const hasAnyItems = bouquet.flowers.length > 0 || bouquet.accessories.length > 0 || Boolean(bouquet.wrapping);

        if (!hasAnyItems) {
            return res.status(400).json({ error: 'Bouquet is empty' });
        }

        const totalPrice = computeTotal(bouquet);
        const titleInput = String(req.body?.title || '').trim();
        const title = titleInput || deriveDefaultTitle(bouquet);

        const created = await prisma.wishlistItem.create({
            data: {
                userId: req.userId,
                title,
                bouquet,
                totalPrice,
            },
            select: {
                id: true,
                title: true,
                bouquet: true,
                totalPrice: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            item: {
                ...created,
                totalPrice: Number(created.totalPrice),
            },
        });
    } catch (err) {
        next(err);
    }
}

async function updateWishlistTitle(req, res, next) {
    try {
        const id = String(req.params.id || '');
        const title = String(req.body?.title || '').trim();

        if (!id) return res.status(400).json({ error: 'Invalid wishlist id' });
        if (title.length < 2) {
            return res.status(400).json({ error: 'Title must have at least 2 characters' });
        }
        if (title.length > 80) {
            return res.status(400).json({ error: 'Title must have at most 80 characters' });
        }

        const updated = await prisma.wishlistItem.updateMany({
            where: {
                id,
                userId: req.userId,
            },
            data: { title },
        });

        if (updated.count === 0) {
            return res.status(404).json({ error: 'Wishlist item not found' });
        }

        return res.json({ id, title });
    } catch (err) {
        next(err);
    }
}

async function deleteWishlistItem(req, res, next) {
    try {
        const id = String(req.params.id || '');
        if (!id) return res.status(400).json({ error: 'Invalid wishlist id' });

        const removed = await prisma.wishlistItem.deleteMany({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (removed.count === 0) {
            return res.status(404).json({ error: 'Wishlist item not found' });
        }

        return res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

async function clearWishlist(req, res, next) {
    try {
        await prisma.wishlistItem.deleteMany({ where: { userId: req.userId } });
        return res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

export { listWishlist, addWishlistItem, updateWishlistTitle, deleteWishlistItem, clearWishlist };
