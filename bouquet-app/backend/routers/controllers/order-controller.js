import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const DELIVERY_PRICES = {
    STANDARD: 19.99,
    SAME_DAY: 29.99,
    EXPRESS: 49.99,
};

const STANDARD_FREE_DELIVERY_THRESHOLD = 50;

const EXPRESS_START_HOUR = 9;
const EXPRESS_END_HOUR = 13;

const SCHEDULE_CONFIG = {
    MIN_DAYS_AHEAD: 1,
    MAX_DAYS_AHEAD: 14,
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

function createBadRequestError(message) {
    const err = new Error(message);
    err.statusCode = 400;
    return err;
}

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizePromoCode(value) {
    return normalizeText(value).toUpperCase();
}

function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
    return email.includes('@') && email.includes('.');
}

function parseScheduleDate(value) {
    const raw = normalizeText(value);
    if (!raw) return null;

    const parsed = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function validateSchedule(shouldSchedule, scheduledFor, scheduledSlot) {
    if (shouldSchedule && (!scheduledFor || !scheduledSlot)) {
        return 'Scheduled delivery requires both date and time slot';
    }

    if (!shouldSchedule || !scheduledFor) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + SCHEDULE_CONFIG.MIN_DAYS_AHEAD);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + SCHEDULE_CONFIG.MAX_DAYS_AHEAD);

    if (scheduledFor < minDate) {
        return `Delivery date must be at least ${SCHEDULE_CONFIG.MIN_DAYS_AHEAD} day(s) from today`;
    }

    if (scheduledFor > maxDate) {
        return `Delivery date cannot be more than ${SCHEDULE_CONFIG.MAX_DAYS_AHEAD} days in advance`;
    }

    return null;
}

function normalizeLocation(value) {
    return normalizeText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function isWeekday(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

function isBucharestArea(city, state) {
    const normalizedCity = normalizeLocation(city);
    const normalizedState = normalizeLocation(state);

    return normalizedCity.includes('bucuresti') && normalizedState.includes('bucuresti');
}

function isIlfovArea(city, state) {
    const normalizedState = normalizeLocation(state);
    return normalizedState.includes('ilfov');
}

function validateDeliveryBusinessRules({
    deliveryOption,
    paymentMethod,
    state,
    city,
    shouldSchedule,
    now,
}) {
    if (shouldSchedule && deliveryOption !== 'STANDARD') {
        return 'Scheduled delivery is available only for Standard delivery';
    }

    if (deliveryOption === 'SAME_DAY') {
        const isCovered = isBucharestArea(city, state) || isIlfovArea(city, state);
        if (!isCovered) {
            return 'Same-Day delivery is available only in Bucharest and Ilfov';
        }

        return null;
    }

    if (deliveryOption === 'EXPRESS') {
        if (paymentMethod !== 'ONLINE') {
            return 'Express delivery is available only for online card payments';
        }

        if (!isBucharestArea(city, state)) {
            return 'Express delivery is available only in Bucharest';
        }

        if (!isWeekday(now)) {
            return 'Express delivery orders can be placed only Monday to Friday between 09:00 and 13:00';
        }

        const currentHour = now.getHours();
        if (currentHour < EXPRESS_START_HOUR || currentHour >= EXPRESS_END_HOUR) {
            return 'Express delivery orders can be placed only between 09:00 and 13:00';
        }
    }

    return null;
}

function computeDeliveryTax(deliveryOption, subtotalAfterDiscount) {
    if (deliveryOption === 'STANDARD' && subtotalAfterDiscount >= STANDARD_FREE_DELIVERY_THRESHOLD) {
        return 0;
    }

    return Number(DELIVERY_PRICES[deliveryOption].toFixed(2));
}

function buildRequiredStockFromCartItems(cartItems) {
    const requiredStockByProduct = new Map();
    const productNameById = new Map();

    cartItems.forEach((cartItem) => {
        cartItem.bouquetItems.forEach((bouquetItem) => {
            const productId = bouquetItem.productId;
            const perBouquetQty = Math.max(1, Number(bouquetItem.quantity || 1));
            const cartQty = Math.max(1, Number(cartItem.quantity || 1));
            const requiredQty = perBouquetQty * cartQty;

            requiredStockByProduct.set(
                productId,
                (requiredStockByProduct.get(productId) || 0) + requiredQty,
            );

            if (!productNameById.has(productId)) {
                productNameById.set(productId, bouquetItem?.product?.name || 'selected product');
            }
        });
    });

    return { requiredStockByProduct, productNameById };
}

function buildRestoreStockFromOrderLines(lines) {
    const requiredStockByProduct = new Map();

    lines.forEach((orderLine) => {
        const bouquetItems = orderLine?.bouquet?.items || [];

        bouquetItems.forEach((bouquetItem) => {
            const productId = bouquetItem.productId;
            const perBouquetQty = Math.max(1, Number(bouquetItem.quantity || 1));
            const orderLineQty = Math.max(1, Number(orderLine.quantity || 1));
            const restoreQty = perBouquetQty * orderLineQty;

            requiredStockByProduct.set(
                productId,
                (requiredStockByProduct.get(productId) || 0) + restoreQty,
            );
        });
    });

    return requiredStockByProduct;
}

function mapOrderSummary(order) {
    return {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        finalPrice: Number(order.finalPrice || 0),
        totalPrice: Number(order.totalPrice || 0),
        totalDiscount: Number(order.totalDiscount || 0),
        deliveryTax: Number(order.deliveryTax || 0),
        deliveryOption: order.deliveryOption,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryStreet: order.deliveryStreet,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
        deliveryZipCode: order.deliveryZipCode,
        deliveryDetails: order.deliveryDetails,
        scheduledFor: order.scheduledFor,
        scheduledSlot: order.scheduledSlot,
        promoCode: order.promoCode,
        promoDiscountPercent: order.promoDiscountPercent != null
            ? Number(order.promoDiscountPercent)
            : null,
        createdAt: order.createdAt,
        lines: order.lines.map((line) => ({
            id: line.id,
            bouquetId: line.bouquetId,
            quantity: line.quantity,
            totalPrice: Number(line.totalPrice || 0),
            priceBouquetSnapshot: Number(line.priceBouquetSnapshot || 0),
        })),
    };
}

function getOrderOwnerWhere(req) {
    if (req.userId) return { userId: req.userId };
    if (req.cartSessionId) return { sessionId: req.cartSessionId };
    return null;
}

async function listOrders(req, res, next) {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.userId },
            include: {
                lines: {
                    select: {
                        id: true,
                        bouquetId: true,
                        quantity: true,
                        totalPrice: true,
                        priceBouquetSnapshot: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({
            orders: orders.map(mapOrderSummary),
        });
    } catch (err) {
        next(err);
    }
}

async function createCashOnDeliveryOrder(req, res, next) {
    try {
        const ownerWhere = getOrderOwnerWhere(req);
        if (!ownerWhere) {
            return res.status(400).json({ error: 'Cart owner not found' });
        }

        const paymentMethod = normalizeText(req.body?.paymentMethod || 'COD').toUpperCase();
        if (paymentMethod !== 'COD') {
            return res.status(400).json({ error: 'Only cash on delivery is available right now' });
        }

        const delivery = req.body?.delivery || {};
        const fullName = normalizeText(delivery.fullName);
        const email = normalizeEmail(delivery.email);
        const phone = normalizeText(delivery.phone);
        const street = normalizeText(delivery.street);
        const city = normalizeText(delivery.city);
        const state = normalizeText(delivery.state);
        const zipCode = normalizeText(delivery.zipCode);
        const details = normalizeText(delivery.details);
        const deliveryOption = normalizeText(req.body?.deliveryOption || 'STANDARD').toUpperCase();
        const promoCode = normalizePromoCode(req.body?.promoCode);
        const shouldSchedule = Boolean(req.body?.schedule?.enabled);
        const scheduledFor = shouldSchedule ? parseScheduleDate(req.body?.schedule?.date) : null;
        const scheduledSlot = shouldSchedule ? normalizeText(req.body?.schedule?.timeSlot) : '';

        if (fullName.length < 2) {
            return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }
        if (!phone || phone.length > 30) {
            return res.status(400).json({ error: 'Phone number is required and must have at most 30 characters' });
        }
        if (!street || !city || !state || !zipCode) {
            return res.status(400).json({ error: 'Street, city, county and zip code are required' });
        }
        if (!Object.prototype.hasOwnProperty.call(DELIVERY_PRICES, deliveryOption)) {
            return res.status(400).json({ error: 'Invalid delivery option' });
        }
        const scheduleError = validateSchedule(shouldSchedule, scheduledFor, scheduledSlot);
        if (scheduleError) {
            return res.status(400).json({ error: scheduleError });
        }

        const deliveryRulesError = validateDeliveryBusinessRules({
            deliveryOption,
            paymentMethod,
            state,
            city,
            shouldSchedule,
            now: new Date(),
        });
        if (deliveryRulesError) {
            return res.status(400).json({ error: deliveryRulesError });
        }

        const cartItems = await prisma.cartItems.findMany({
            where: ownerWhere,
            include: {
                bouquet: {
                    select: {
                        items: {
                            select: {
                                productId: true,
                                quantity: true,
                                product: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }

        const normalizedCartItems = cartItems.map((item) => ({
            id: item.id,
            bouquetId: item.bouquetId,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            bouquetItems: Array.isArray(item?.bouquet?.items) ? item.bouquet.items : [],
        }));

        let promo = null;
        if (promoCode) {
            promo = await prisma.promoCode.findUnique({
                where: { code: promoCode },
                select: {
                    code: true,
                    discountPercent: true,
                    isActive: true,
                },
            });

            if (!promo || !promo.isActive) {
                return res.status(400).json({ error: 'Invalid promo code' });
            }
        }

        const subtotal = Number(
            normalizedCartItems.reduce(
                (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
                0,
            ).toFixed(2),
        );
        const discountPercent = promo ? Number(promo.discountPercent || 0) : 0;
        const totalDiscount = Number(((subtotal * discountPercent) / 100).toFixed(2));
        const subtotalAfterDiscount = Number((subtotal - totalDiscount).toFixed(2));
        const deliveryTax = computeDeliveryTax(deliveryOption, subtotalAfterDiscount);
        const finalPrice = Number((subtotal - totalDiscount + deliveryTax).toFixed(2));

        const { requiredStockByProduct, productNameById } = buildRequiredStockFromCartItems(normalizedCartItems);

        const order = await prisma.$transaction(async (tx) => {
            for (const [productId, requiredQty] of requiredStockByProduct.entries()) {
                const updated = await tx.product.updateMany({
                    where: {
                        id: productId,
                        stock: { gte: requiredQty },
                    },
                    data: {
                        stock: { decrement: requiredQty },
                    },
                });

                if (updated.count === 0) {
                    const productName = productNameById.get(productId) || 'selected product';
                    throw createBadRequestError(`Insufficient stock for ${productName}`);
                }
            }

            const createdOrder = await tx.order.create({
                data: {
                    userId: req.userId || null,
                    guestSessionId: req.userId ? null : req.cartSessionId,
                    customerEmail: email,
                    customerName: fullName,
                    customerPhone: phone,
                    deliveryStreet: street,
                    deliveryCity: city,
                    deliveryState: state,
                    deliveryZipCode: zipCode,
                    deliveryDetails: details || null,
                    deliveryOption,
                    scheduledFor,
                    scheduledSlot: scheduledSlot || null,
                    paymentMethod: 'COD',
                    promoCode: promo?.code || null,
                    promoDiscountPercent: promo ? discountPercent : null,
                    totalPrice: subtotal,
                    totalDiscount,
                    deliveryTax,
                    finalPrice,
                    status: 'CREATED',
                    lines: {
                        create: normalizedCartItems.map((item) => ({
                            bouquetId: item.bouquetId,
                            quantity: Number(item.quantity || 1),
                            priceBouquetSnapshot: Number(item.unitPrice || 0),
                            totalPrice: Number((Number(item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)),
                        })),
                    },
                },
                include: {
                    lines: {
                        select: {
                            id: true,
                            bouquetId: true,
                            quantity: true,
                            totalPrice: true,
                            priceBouquetSnapshot: true,
                        },
                    },
                },
            });

            await tx.cartItems.deleteMany({
                where: ownerWhere,
            });

            return createdOrder;
        });

        return res.status(201).json({
            order: mapOrderSummary(order),
            message: 'Cash on delivery order placed successfully.',
        });
    } catch (err) {
        next(err);
    }
}

async function createOnlinePaymentOrder(req, res, next) {
    try {
        if (!stripe) {
            return res.status(500).json({ error: 'Stripe is not configured' });
        }

        const ownerWhere = getOrderOwnerWhere(req);
        if (!ownerWhere) {
            return res.status(400).json({ error: 'Cart owner not found' });
        }

        const paymentMethod = normalizeText(req.body?.paymentMethod || 'ONLINE').toUpperCase();
        if (paymentMethod !== 'ONLINE') {
            return res.status(400).json({ error: 'Invalid payment method for online checkout' });
        }

        const delivery = req.body?.delivery || {};
        const fullName = normalizeText(delivery.fullName);
        const email = normalizeEmail(delivery.email);
        const phone = normalizeText(delivery.phone);
        const street = normalizeText(delivery.street);
        const city = normalizeText(delivery.city);
        const state = normalizeText(delivery.state);
        const zipCode = normalizeText(delivery.zipCode);
        const details = normalizeText(delivery.details);
        const deliveryOption = normalizeText(req.body?.deliveryOption || 'STANDARD').toUpperCase();
        const promoCode = normalizePromoCode(req.body?.promoCode);
        const shouldSchedule = Boolean(req.body?.schedule?.enabled);
        const scheduledFor = shouldSchedule ? parseScheduleDate(req.body?.schedule?.date) : null;
        const scheduledSlot = shouldSchedule ? normalizeText(req.body?.schedule?.timeSlot) : '';

        if (fullName.length < 2) {
            return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }
        if (!phone || phone.length > 30) {
            return res.status(400).json({ error: 'Phone number is required and must have at most 30 characters' });
        }
        if (!street || !city || !state || !zipCode) {
            return res.status(400).json({ error: 'Street, city, county and zip code are required' });
        }
        if (!Object.prototype.hasOwnProperty.call(DELIVERY_PRICES, deliveryOption)) {
            return res.status(400).json({ error: 'Invalid delivery option' });
        }

        const scheduleError = validateSchedule(shouldSchedule, scheduledFor, scheduledSlot);
        if (scheduleError) {
            return res.status(400).json({ error: scheduleError });
        }

        const deliveryRulesError = validateDeliveryBusinessRules({
            deliveryOption,
            paymentMethod,
            state,
            city,
            shouldSchedule,
            now: new Date(),
        });
        if (deliveryRulesError) {
            return res.status(400).json({ error: deliveryRulesError });
        }

        const cartItems = await prisma.cartItems.findMany({
            where: ownerWhere,
            include: {
                bouquet: {
                    select: {
                        items: {
                            select: {
                                productId: true,
                                quantity: true,
                                product: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }

        const normalizedCartItems = cartItems.map((item) => ({
            id: item.id,
            bouquetId: item.bouquetId,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            bouquetItems: Array.isArray(item?.bouquet?.items) ? item.bouquet.items : [],
        }));

        let promo = null;
        if (promoCode) {
            promo = await prisma.promoCode.findUnique({
                where: { code: promoCode },
                select: {
                    code: true,
                    discountPercent: true,
                    isActive: true,
                },
            });

            if (!promo || !promo.isActive) {
                return res.status(400).json({ error: 'Invalid promo code' });
            }
        }

        const subtotal = Number(
            normalizedCartItems.reduce(
                (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
                0,
            ).toFixed(2),
        );
        const discountPercent = promo ? Number(promo.discountPercent || 0) : 0;
        const totalDiscount = Number(((subtotal * discountPercent) / 100).toFixed(2));
        const subtotalAfterDiscount = Number((subtotal - totalDiscount).toFixed(2));
        const deliveryTax = computeDeliveryTax(deliveryOption, subtotalAfterDiscount);
        const finalPrice = Number((subtotal - totalDiscount + deliveryTax).toFixed(2));

        const { requiredStockByProduct, productNameById } = buildRequiredStockFromCartItems(normalizedCartItems);

        const orderId = randomUUID();

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            success_url: `${FRONTEND_URL}/payment-success`,
            cancel_url: `${FRONTEND_URL}/payment-failure`,
            customer_email: req.userEmail || undefined,
            metadata: {
                orderId,
                source: 'bouquet-app',
            },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'ron',
                        product_data: {
                            name: 'Custom bouquet order',
                            description: `Delivery: ${deliveryOption}`,
                        },
                        unit_amount: Math.max(1, Math.round(finalPrice * 100)),
                    },
                },
            ],
        });

        try {
            await prisma.$transaction(async (tx) => {
                await tx.order.create({
                    data: {
                        id: orderId,
                        userId: req.userId || null,
                        guestSessionId: req.userId ? null : req.cartSessionId,
                        customerEmail: email,
                        customerName: fullName,
                        customerPhone: phone,
                        deliveryStreet: street,
                        deliveryCity: city,
                        deliveryState: state,
                        deliveryZipCode: zipCode,
                        deliveryDetails: details || null,
                        deliveryOption,
                        scheduledFor,
                        scheduledSlot: scheduledSlot || null,
                        paymentMethod: 'ONLINE',
                        promoCode: promo?.code || null,
                        promoDiscountPercent: promo ? discountPercent : null,
                        totalPrice: subtotal,
                        totalDiscount,
                        deliveryTax,
                        finalPrice,
                        status: 'CREATED',
                        lines: {
                            create: normalizedCartItems.map((item) => ({
                                bouquetId: item.bouquetId,
                                quantity: Number(item.quantity || 1),
                                priceBouquetSnapshot: Number(item.unitPrice || 0),
                                totalPrice: Number((Number(item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)),
                            })),
                        },
                    },
                });

                await tx.cartItems.deleteMany({
                    where: ownerWhere,
                });
            });
        } catch (err) {
            await stripe.checkout.sessions.expire(session.id).catch(() => null);
            throw err;
        }

        return res.status(201).json({
            checkoutUrl: session.url,
            orderId,
        });
    } catch (err) {
        next(err);
    }
}

async function handleStripeWebhook(req, res, next) {
    try {
        if (!stripe || !STRIPE_WEBHOOK_SECRET) {
            return res.status(500).json({ error: 'Stripe webhook is not configured' });
        }

        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing Stripe signature' });
        }

        const event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);

        const restoreReservedStockIfNeeded = async (orderId) => {
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: {
                        lines: {
                            include: {
                                bouquet: {
                                    include: {
                                        items: {
                                            select: {
                                                productId: true,
                                                quantity: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });

                if (!order || order.status !== 'CREATED') {
                    return;
                }

                const restoreByProduct = buildRestoreStockFromOrderLines(order.lines);
                for (const [productId, restoreQty] of restoreByProduct.entries()) {
                    await tx.product.update({
                        where: { id: productId },
                        data: { stock: { increment: restoreQty } },
                    });
                }

                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'FAILED' },
                });
            });
        };

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session?.metadata?.orderId;

            if (orderId) {
                await prisma.$transaction(async (tx) => {
                    const order = await tx.order.findUnique({
                        where: { id: orderId },
                        include: {
                            lines: {
                                include: {
                                    bouquet: {
                                        include: {
                                            items: {
                                                select: {
                                                    productId: true,
                                                    quantity: true,
                                                    product: {
                                                        select: {
                                                            name: true,
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

                    if (!order || order.status !== 'CREATED') {
                        return;
                    }

                    const requiredStockByProduct = buildRequiredStockFromOrderLines(order.lines);
                    const productNameById = new Map();

                    order.lines.forEach((line) => {
                        const items = line?.bouquet?.items || [];
                        items.forEach((item) => {
                            if (!productNameById.has(item.productId)) {
                                productNameById.set(item.productId, item?.product?.name || 'selected product');
                            }
                        });
                    });

                    for (const [productId, requiredQty] of requiredStockByProduct.entries()) {
                        const updated = await tx.product.updateMany({
                            where: {
                                id: productId,
                                stock: { gte: requiredQty },
                            },
                            data: {
                                stock: { decrement: requiredQty },
                            },
                        });

                        if (updated.count === 0) {
                            const productName = productNameById.get(productId) || 'selected product';
                            await tx.order.update({
                                where: { id: orderId },
                                data: { status: 'FAILED' },
                            });
                            return;
                        }
                    }

                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: 'CONFIRMED' },
                    });
                });
            }
        }

        if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
            const session = event.data.object;
            const orderId = session?.metadata?.orderId;

            if (orderId) {
                await restoreReservedStockIfNeeded(orderId);
            }
        }

        return res.json({ received: true });
    } catch (err) {
        next(err);
    }
}

async function cancelOrder(req, res, next) {
    try {
        const orderId = String(req.params.id || '').trim();
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                lines: {
                    include: {
                        bouquet: {
                            include: {
                                items: {
                                    select: {
                                        productId: true,
                                        quantity: true,
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

        if (order.userId !== req.userId) {
            return res.status(403).json({ error: 'You can cancel only your own orders' });
        }

        if (order.status !== 'CONFIRMED' && order.status !== 'CREATED') {
            return res.status(409).json({
                error: `Cannot cancel order with status ${order.status}. Only CONFIRMED or CREATED orders can be cancelled.`,
            });
        }

        const requiredStockByProduct = buildRestoreStockFromOrderLines(order.lines);

        const updatedOrder = await prisma.$transaction(async (tx) => {
            for (const [productId, restoreQty] of requiredStockByProduct.entries()) {
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        stock: { increment: restoreQty },
                    },
                });
            }

            const cancelled = await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' },
                include: {
                    lines: {
                        select: {
                            id: true,
                            bouquetId: true,
                            quantity: true,
                            totalPrice: true,
                            priceBouquetSnapshot: true,
                        },
                    },
                },
            });

            return cancelled;
        });

        return res.json({
            order: mapOrderSummary(updatedOrder),
            message: 'Order cancelled successfully. Stock has been restored.',
        });
    } catch (err) {
        next(err);
    }
}

export { createCashOnDeliveryOrder, createOnlinePaymentOrder, listOrders, cancelOrder, handleStripeWebhook };
