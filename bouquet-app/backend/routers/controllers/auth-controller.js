import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { sendVerificationEmail } from '../../utils/emailService.js'

const prisma = new PrismaClient();
const DEFAULT_ROLE_NAME = 'USER';

function getFrontendVerificationRedirectUrl(status) {
    const frontendBaseUrl = String(process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const path = status === 'success' ? '/email-verification-success' : '/email-verification-failure';
    return `${frontendBaseUrl}${path}`;
}

function formatAddressForResponse(address) {
    const clean = (value) => {
        const v = String(value || '').trim();
        return v === '-' ? '' : v;
    };

    if (!address) {
        return {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            details: '',
        };
    }

    return {
        street: clean(address.street),
        city: clean(address.city),
        state: clean(address.state),
        zipCode: clean(address.zipCode),
        details: clean(address.details),
    };
}

function setAuthCookie(res, userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
    });
}

async function migrateGuestOrdersToUser(userId, email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!userId || !normalizedEmail) return;

    await prisma.order.updateMany({
        where: {
            customerEmail: normalizedEmail,
            userId: null,
        },
        data: {
            userId,
            guestSessionId: null,
        }
    });
}

async function register(req, res, next) {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (name.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters long" });
        if (!email.includes('@')) return res.status(400).json({ error: "Invalid email address" });
        if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters long" });

        const existingUser = await prisma.user.findUnique({ where: { email: email } });
        if (existingUser) return res.status(409).json({ error: "Email already in use" });

        const userRole = await prisma.role.upsert({
            where: { name: DEFAULT_ROLE_NAME },
            update: {},
            create: { name: DEFAULT_ROLE_NAME },
        });

        // randomBytes uses a cryptographically secure PRNG suitable for security tokens.
        const verificationToken = crypto.randomBytes(32).toString('hex');
        // Keep token short-lived to reduce replay risk if a link leaks.
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                passwordHash: await bcrypt.hash(password, 10),
                roleId: userRole.id,
                verificationToken,
                tokenExpiresAt,
            }
        });

        await sendVerificationEmail(user.email, verificationToken, user.name);

        return res.status(201).json({
            message: 'Registration successful. Please verify your email address within 24 hours.',
            user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified }
        });
    }
    catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!email.includes('@')) return res.status(400).json({ error: "Invalid email address" });
        if (!password) return res.status(400).json({ error: "Password is required" });
        if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters long" });

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email },
            select: {
                id: true,
                name: true,
                email: true,
                isVerified: true,
                passwordHash: true
            }
        });

        if (!user) return res.status(401).json({ error: "Invalid email" });

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return res.status(401).json({ error: "Invalid password" });

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Email is not verified. Please check your inbox.' });
        }

        await migrateGuestOrdersToUser(user.id, email);

        setAuthCookie(res, user.id);

        return res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
    }
    catch (err) {
        next(err);
    }
}

async function verify(req, res, next) {
    try {
        const token = String(req.query.token || '').trim();

        if (!token) {
            return res.redirect(getFrontendVerificationRedirectUrl('failure'));
        }

        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                tokenExpiresAt: {
                    gt: new Date(),
                },
            },
            select: {
                id: true,
                email: true,
            },
        });

        if (!user) {
            return res.redirect(getFrontendVerificationRedirectUrl('failure'));
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                tokenExpiresAt: null,
            },
        });

        return res.redirect(getFrontendVerificationRedirectUrl('success'));
    }
    catch (err) {
        next(err);
    }
}

async function me(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
                phone: true,
                address: {
                    select: {
                        street: true,
                        city: true,
                        state: true,
                        zipCode: true,
                        details: true,
                    },
                },
                _count: {
                    select: {
                        orders: true,
                        wishlist: true,
                    },
                },
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role?.name || null,
                phone: user.phone || '',
                address: formatAddressForResponse(user.address),
                stats: {
                    orders: user._count.orders,
                    wishlist: user._count.wishlist,
                },
            }
        });
    }
    catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const phone = String(req.body?.phone || '').trim();
        const addressInput = req.body?.address;
        const isAddressObject = addressInput && typeof addressInput === 'object';
        const legacyAddressText = !isAddressObject ? String(addressInput || '').trim() : '';

        const street = isAddressObject ? String(addressInput.street || '').trim() : legacyAddressText;
        const city = isAddressObject ? String(addressInput.city || '').trim() : '';
        const state = isAddressObject ? String(addressInput.state || '').trim() : '';
        const zipCode = isAddressObject ? String(addressInput.zipCode || '').trim() : '';
        const details = isAddressObject ? String(addressInput.details || '').trim() : legacyAddressText;

        const hasAddressData = [street, city, state, zipCode, details].some((part) => part.length > 0);

        if (phone.length > 30) {
            return res.status(400).json({ error: 'Phone number must have at most 30 characters' });
        }

        await prisma.user.update({
            where: { id: req.userId },
            data: {
                phone: phone || null,
            },
        });

        if (hasAddressData) {
            await prisma.address.upsert({
                where: { userId: req.userId },
                update: {
                    street,
                    city,
                    state,
                    zipCode,
                    details: details || null,
                },
                create: {
                    userId: req.userId,
                    street,
                    city,
                    state,
                    zipCode,
                    details: details || null,
                },
            });
        } else {
            await prisma.address.deleteMany({
                where: { userId: req.userId },
            });
        }

        return me(req, res, next);
    }
    catch (err) {
        next(err);
    }
}

function logout(req, res) {
    res.clearCookie('access_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    });

    return res.json({ ok: true });
}

export { register, verify, login, me, updateProfile, logout };