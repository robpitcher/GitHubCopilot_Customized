/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created, returns JWT token
 *       409:
 *         description: Email already registered
 *
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile (without passwordHash)
 *       401:
 *         description: Not authenticated
 *
 * /api/auth/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *               priceAlerts:
 *                 type: boolean
 *               stockAlerts:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 *       401:
 *         description: Not authenticated
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { users, nextUserId } from '../store';
import { requireAuth, AuthenticatedRequest, JWT_SECRET, JWT_EXPIRY } from '../middleware/auth';
import { User, NotificationPreferences } from '../models/user';

const router = express.Router();

const BCRYPT_ROUNDS = 10;

// Rate limit auth endpoints: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all auth routes
router.use(authLimiter);

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    const { email, name, password } = req.body as { email?: string; name?: string; password?: string };

    if (!email || !name || !password) {
        res.status(400).json({ error: 'email, name, and password are required' });
        return;
    }

    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser: User = {
        userId: nextUserId(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        notificationPreferences: { email: true, push: true, priceAlerts: true, stockAlerts: true },
        createdAt: new Date().toISOString()
    };
    users.push(newUser);

    const token = jwt.sign({ userId: newUser.userId, email: newUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = users.find(u => u.userId === req.userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const { passwordHash: _ph, ...safeUser } = user;
    res.json(safeUser);
});

// PUT /api/auth/preferences
router.put('/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
    const userIndex = users.findIndex(u => u.userId === req.userId);
    if (userIndex === -1) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    const { email, push, priceAlerts, stockAlerts } = req.body as Partial<NotificationPreferences>;
    const prefs = users[userIndex].notificationPreferences;

    if (email !== undefined) prefs.email = email;
    if (push !== undefined) prefs.push = push;
    if (priceAlerts !== undefined) prefs.priceAlerts = priceAlerts;
    if (stockAlerts !== undefined) prefs.stockAlerts = stockAlerts;

    users[userIndex].notificationPreferences = prefs;
    res.json(prefs);
});

export default router;
