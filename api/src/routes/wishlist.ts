/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: User wishlist management
 *
 * /api/wishlist:
 *   get:
 *     summary: Get the current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Add a product to the wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Item added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Product already in wishlist
 *       401:
 *         description: Not authenticated
 *
 * /api/wishlist/bulk:
 *   post:
 *     summary: Bulk sync products from localStorage
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Bulk sync complete, returns full updated wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 *       401:
 *         description: Not authenticated
 *
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from the wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to remove
 *     responses:
 *       204:
 *         description: Item removed successfully
 *       404:
 *         description: Item not found in wishlist
 *       401:
 *         description: Not authenticated
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { WishlistItem } from '../models/wishlist';
import { wishlistItems as seedWishlistItems } from '../seedData';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const wishlistLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' }
});

let wishlistItems: WishlistItem[] = [...seedWishlistItems];

// Get user's wishlist
router.get('/', wishlistLimiter, authenticateToken, (req: AuthRequest, res) => {
    const userItems = wishlistItems.filter(w => w.userId === req.userId);
    res.json(userItems);
});

// Add product to wishlist
router.post('/', wishlistLimiter, authenticateToken, (req: AuthRequest, res) => {
    const { productId } = req.body;

    if (!productId) {
        res.status(400).json({ error: 'productId is required' });
        return;
    }

    const existing = wishlistItems.find(w => w.userId === req.userId && w.productId === productId);
    if (existing) {
        res.status(400).json({ error: 'Product already in wishlist' });
        return;
    }

    const newItem: WishlistItem = {
        wishlistId: wishlistItems.length > 0 ? Math.max(...wishlistItems.map(w => w.wishlistId)) + 1 : 1,
        userId: req.userId!,
        productId,
        addedAt: new Date().toISOString()
    };
    wishlistItems.push(newItem);
    res.status(201).json(newItem);
});

// Bulk sync from localStorage
router.post('/bulk', wishlistLimiter, authenticateToken, (req: AuthRequest, res) => {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
        res.status(400).json({ error: 'productIds must be an array' });
        return;
    }

    for (const productId of productIds) {
        const exists = wishlistItems.some(w => w.userId === req.userId && w.productId === productId);
        if (!exists) {
            const newItem: WishlistItem = {
                wishlistId: wishlistItems.length > 0 ? Math.max(...wishlistItems.map(w => w.wishlistId)) + 1 : 1,
                userId: req.userId!,
                productId,
                addedAt: new Date().toISOString()
            };
            wishlistItems.push(newItem);
        }
    }

    const userItems = wishlistItems.filter(w => w.userId === req.userId);
    res.json(userItems);
});

// Remove product from wishlist
router.delete('/:productId', wishlistLimiter, authenticateToken, (req: AuthRequest, res) => {
    const productId = parseInt(req.params.productId);
    const index = wishlistItems.findIndex(w => w.userId === req.userId && w.productId === productId);

    if (index === -1) {
        res.status(404).json({ error: 'Item not found in wishlist' });
        return;
    }

    wishlistItems.splice(index, 1);
    res.status(204).send();
});

export default router;
