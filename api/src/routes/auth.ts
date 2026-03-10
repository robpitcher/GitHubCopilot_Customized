/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 *
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
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or email already registered
 *
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid email or password
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/user';
import { users as seedUsers } from '../seedData';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'octocat-secret-key';
const SALT_ROUNDS = 10;

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' }
});

let users: User[] = [...seedUsers];

// Register
router.post('/register', authLimiter, async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
        res.status(400).json({ error: 'Email, name, and password are required' });
        return;
    }

    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
    }

    const existing = users.find(u => u.email === email);
    if (existing) {
        res.status(400).json({ error: 'Email already registered' });
        return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser: User = {
        userId: users.length > 0 ? Math.max(...users.map(u => u.userId)) + 1 : 1,
        email,
        name,
        passwordHash,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);

    const token = jwt.sign({ userId: newUser.userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
        token,
        user: { userId: newUser.userId, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt }
    });
});

// Login
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
        token,
        user: { userId: user.userId, email: user.email, name: user.name, createdAt: user.createdAt }
    });
});

// Get current user
router.get('/me', authLimiter, authenticateToken, (req: AuthRequest, res) => {
    const user = users.find(u => u.userId === req.userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json({ userId: user.userId, email: user.email, name: user.name, createdAt: user.createdAt });
});

export default router;
