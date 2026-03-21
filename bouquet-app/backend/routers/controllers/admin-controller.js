import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TREND_MONTHS = 6;

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

export async function getDashboardStats(req, res, next) {
    try {
        const confirmedOrders = await prisma.order.findMany({
            where: { status: 'CONFIRMED' },
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

        const totalRevenue = round2(
            confirmedOrders.reduce((sum, order) => sum + Number(order.finalPrice || 0), 0),
        );
        const totalOrders = confirmedOrders.length;
        const avgOrderValue = totalOrders > 0 ? round2(totalRevenue / totalOrders) : 0;

        const uniqueCustomers = new Set();
        confirmedOrders.forEach((order) => {
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

        confirmedOrders.forEach((order) => {
            const createdAt = new Date(order.createdAt);
            const key = monthKey(createdAt);

            if (!monthRevenueMap.has(key)) return;

            monthRevenueMap.set(
                key,
                monthRevenueMap.get(key) + Number(order.finalPrice || 0),
            );

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

        const currentMonthOrders = confirmedOrders.filter((order) => {
            const createdAt = new Date(order.createdAt);
            const currentMonth = recentMonths[recentMonths.length - 1];
            return (
                createdAt.getFullYear() === currentMonth.getFullYear()
                && createdAt.getMonth() === currentMonth.getMonth()
            );
        }).length;

        const previousMonthOrders = confirmedOrders.filter((order) => {
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

        confirmedOrders.forEach((order) => {
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
