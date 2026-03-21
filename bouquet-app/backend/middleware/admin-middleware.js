import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function requireAdmin(req, res, next) {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                role: {
                    select: { name: true },
                },
            },
        });

        if (!user || user.role?.name !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        return next();
    } catch (err) {
        return next(err);
    }
}
