import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();
const DEFAULT_ROLE_NAME = 'USER';

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

        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                passwordHash: await bcrypt.hash(password, 10),
                roleId: userRole.id,
            }
        });

        setAuthCookie(res, user.id);
        return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
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
                passwordHash: true
            }
        });

        if (!user) return res.status(401).json({ error: "Invalid email" });

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return res.status(401).json({ error: "Invalid password" });

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

async function me(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        return res.json({ user });
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

export { register, login, me, logout };