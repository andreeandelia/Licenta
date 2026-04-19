import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ORDER_STATUSES = new Set([
    'CREATED',
    'CONFIRMED',
    'IN_PREPARATION',
    'READY_FOR_DELIVERY',
    'IN_DELIVERY',
    'DELIVERED',
    'FAILED',
    'CANCELLED',
]);

function round2(value) {
    return Number(Number(value || 0).toFixed(2));
}

function toOrderSummary(order) {
    return {
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryOption: order.deliveryOption,
        scheduledFor: order.scheduledFor,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        finalPrice: round2(order.finalPrice),
        status: order.status,
        bouquetCount: order.lines?.length || 0,
    };
}

function toOrderDetail(order) {
    return {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryStreet: order.deliveryStreet,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
        deliveryZipCode: order.deliveryZipCode,
        deliveryDetails: order.deliveryDetails,
        deliveryOption: order.deliveryOption,
        scheduledFor: order.scheduledFor,
        scheduledSlot: order.scheduledSlot,
        paymentMethod: order.paymentMethod,
        promoCode: order.promoCode,
        promoDiscountPercent: order.promoDiscountPercent != null
            ? Number(order.promoDiscountPercent)
            : null,
        totalPrice: round2(order.totalPrice),
        totalDiscount: round2(order.totalDiscount),
        deliveryTax: round2(order.deliveryTax),
        finalPrice: round2(order.finalPrice),
        lines: (order.lines || []).map((line) => ({
            id: line.id,
            quantity: line.quantity,
            priceBouquetSnapshot: round2(line.priceBouquetSnapshot),
            totalPrice: round2(line.totalPrice),
            bouquet: line.bouquet ? {
                id: line.bouquet.id,
                price: round2(line.bouquet.price),
                items: (line.bouquet.items || []).map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                    priceSnapshot: round2(item.priceSnapshot),
                    product: item.product ? {
                        id: item.product.id,
                        name: item.product.name,
                        type: item.product.type,
                        imageUrl: item.product.imageUrl,
                    } : null,
                })),
            } : null,
        })),
    };
}

export async function listAdminOrders(req, res, next) {
    try {
        const orders = await prisma.order.findMany({
            select: {
                id: true,
                customerName: true,
                customerPhone: true,
                deliveryOption: true,
                scheduledFor: true,
                createdAt: true,
                paymentMethod: true,
                finalPrice: true,
                status: true,
                lines: {
                    select: { id: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({
            items: orders.map(toOrderSummary),
        });
    } catch (err) {
        return next(err);
    }
}

export async function getAdminOrder(req, res, next) {
    try {
        const id = String(req.params.id);

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                lines: {
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
                                                imageUrl: true,
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

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.json({
            item: toOrderDetail(order),
        });
    } catch (err) {
        return next(err);
    }
}

export async function updateAdminOrderStatus(req, res, next) {
    try {
        const id = String(req.params.id);
        const newStatus = String(req.body?.status || '').toUpperCase();

        if (!VALID_ORDER_STATUSES.has(newStatus)) {
            return res.status(400).json({
                error: `Invalid status. Allowed values: ${Array.from(VALID_ORDER_STATUSES).join(', ')}`,
            });
        }

        const existing = await prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status: newStatus },
            include: {
                lines: {
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
                                                imageUrl: true,
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

        return res.json({
            item: toOrderDetail(updated),
        });
    } catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Order not found' });
        }

        return next(err);
    }
}
