/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: User wishlist management with sharing and notifications
 */

import express from 'express';
import crypto from 'crypto';
import { wishlistItems, wishlistShares, notifications, users, nextWishlistId, nextShareId, nextNotificationId } from '../store';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { WishlistItem } from '../models/wishlist';
import { WishlistShare } from '../models/wishlistShare';
import { Notification } from '../models/notification';
import { getRecommendations } from '../services/recommendations';
import { products as allProducts } from './product';

const router = express.Router();

// All wishlist routes require authentication
router.use(requireAuth);

// GET /api/wishlist - Get user's wishlist with full product details
router.get('/', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const userItems = wishlistItems.filter(item => item.userId === userId);
    const enriched = userItems.map(item => {
        const product = allProducts.find(p => p.productId === item.productId);
        return { ...item, product: product ?? null };
    });
    res.json(enriched);
});

// POST /api/wishlist - Add product to wishlist
router.post('/', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { productId, priority = 'medium', notes, notifyOnPriceDrop = false, notifyOnStock = false } =
        req.body as {
            productId?: number;
            priority?: 'low' | 'medium' | 'high';
            notes?: string;
            notifyOnPriceDrop?: boolean;
            notifyOnStock?: boolean;
        };

    if (!productId) {
        res.status(400).json({ error: 'productId is required' });
        return;
    }

    const product = allProducts.find(p => p.productId === productId);
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }

    const existing = wishlistItems.find(item => item.userId === userId && item.productId === productId);
    if (existing) {
        res.status(409).json({ error: 'Product already in wishlist' });
        return;
    }

    const currentPrice = product.discount ? product.price * (1 - product.discount) : product.price;

    const newItem: WishlistItem = {
        wishlistId: nextWishlistId(),
        userId,
        productId,
        addedAt: new Date().toISOString(),
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        notes: notes ? String(notes).replace(/<[^>]*>/g, '') : undefined, // Sanitize notes
        priceWhenAdded: currentPrice,
        notifyOnPriceDrop,
        notifyOnStock
    };
    wishlistItems.push(newItem);
    res.status(201).json({ ...newItem, product });
});

// PUT /api/wishlist/:productId - Update wishlist item settings
router.put('/:productId', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const productId = parseInt(req.params.productId);
    const index = wishlistItems.findIndex(item => item.userId === userId && item.productId === productId);
    if (index === -1) {
        res.status(404).json({ error: 'Wishlist item not found' });
        return;
    }

    const { priority, notes, notifyOnPriceDrop, notifyOnStock } = req.body as Partial<WishlistItem>;

    if (priority !== undefined) {
        if (!['low', 'medium', 'high'].includes(priority)) {
            res.status(400).json({ error: 'priority must be low, medium, or high' });
            return;
        }
        wishlistItems[index].priority = priority;
    }
    if (notes !== undefined) {
        wishlistItems[index].notes = String(notes).replace(/<[^>]*>/g, ''); // Sanitize notes
    }
    if (notifyOnPriceDrop !== undefined) {
        wishlistItems[index].notifyOnPriceDrop = notifyOnPriceDrop;
    }
    if (notifyOnStock !== undefined) {
        wishlistItems[index].notifyOnStock = notifyOnStock;
    }

    const product = allProducts.find(p => p.productId === productId);
    res.json({ ...wishlistItems[index], product: product ?? null });
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const productId = parseInt(req.params.productId);
    const index = wishlistItems.findIndex(item => item.userId === userId && item.productId === productId);
    if (index === -1) {
        res.status(404).json({ error: 'Wishlist item not found' });
        return;
    }
    wishlistItems.splice(index, 1);
    res.status(204).send();
});

// POST /api/wishlist/bulk - Bulk add products
router.post('/bulk', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const items = req.body as Array<{
        productId: number;
        priority?: 'low' | 'medium' | 'high';
        notes?: string;
        notifyOnPriceDrop?: boolean;
        notifyOnStock?: boolean;
    }>;

    if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Request body must be an array of items' });
        return;
    }

    const added: WishlistItem[] = [];
    const skipped: number[] = [];

    for (const item of items) {
        const { productId, priority = 'medium', notes, notifyOnPriceDrop = false, notifyOnStock = false } = item;
        const product = allProducts.find(p => p.productId === productId);
        if (!product) { skipped.push(productId); continue; }

        const existing = wishlistItems.find(w => w.userId === userId && w.productId === productId);
        if (existing) { skipped.push(productId); continue; }

        const currentPrice = product.discount ? product.price * (1 - product.discount) : product.price;
        const newItem: WishlistItem = {
            wishlistId: nextWishlistId(),
            userId,
            productId,
            addedAt: new Date().toISOString(),
            priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
            notes: notes ? String(notes).replace(/<[^>]*>/g, '') : undefined,
            priceWhenAdded: currentPrice,
            notifyOnPriceDrop,
            notifyOnStock
        };
        wishlistItems.push(newItem);
        added.push(newItem);
    }

    res.status(201).json({ added, skipped });
});

// GET /api/wishlist/recommendations - AI-powered product suggestions
router.get('/recommendations', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const userItems = wishlistItems.filter(item => item.userId === userId);
    const recommendations = getRecommendations(userItems, allProducts);
    res.json(recommendations);
});

// POST /api/wishlist/share - Create shareable link
router.post('/share', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { isPublic = true, expiresAt } = req.body as { isPublic?: boolean; expiresAt?: string };

    // Rate limit: max 5 active shares per user
    const activeShares = wishlistShares.filter(s => s.userId === userId);
    if (activeShares.length >= 5) {
        res.status(429).json({ error: 'Maximum of 5 active share links allowed' });
        return;
    }

    // Validate expiry date if provided
    if (expiresAt) {
        const expiry = new Date(expiresAt);
        if (isNaN(expiry.getTime()) || expiry <= new Date()) {
            res.status(400).json({ error: 'expiresAt must be a valid future date' });
            return;
        }
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    const share: WishlistShare = {
        shareId: nextShareId(),
        wishlistId: userId, // one wishlist per user
        userId,
        shareToken,
        isPublic,
        expiresAt: expiresAt ?? undefined,
        viewCount: 0,
        createdAt: new Date().toISOString()
    };
    wishlistShares.push(share);
    res.status(201).json(share);
});

// GET /api/wishlist/share/:token - View shared wishlist (public, no auth required)
// Note: This route is defined outside requireAuth middleware scope
// (handled in the exported router with separate middleware logic below)

// DELETE /api/wishlist/share/:shareId - Revoke a share link
router.delete('/share/:shareId', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const shareId = parseInt(req.params.shareId);
    const index = wishlistShares.findIndex(s => s.shareId === shareId && s.userId === userId);
    if (index === -1) {
        res.status(404).json({ error: 'Share not found' });
        return;
    }
    wishlistShares.splice(index, 1);
    res.status(204).send();
});

export default router;

/**
 * Public share view route (no auth required).
 * Mounted separately on /api/wishlist/share/:token
 */
export function createPublicShareRouter() {
    const publicRouter = express.Router();

    publicRouter.get('/:token', (req, res) => {
        const { token } = req.params;
        // Validate token format to prevent injection
        if (!/^[0-9a-f]{32}$/.test(token)) {
            res.status(400).json({ error: 'Invalid share token format' });
            return;
        }

        const share = wishlistShares.find(s => s.shareToken === token && s.isPublic);
        if (!share) {
            res.status(404).json({ error: 'Share not found or not public' });
            return;
        }

        // Check expiry
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
            res.status(410).json({ error: 'Share link has expired' });
            return;
        }

        share.viewCount++;

        const owner = users.find(u => u.userId === share.userId);
        const items = wishlistItems
            .filter(item => item.userId === share.userId)
            .map(item => {
                const product = allProducts.find(p => p.productId === item.productId);
                return { ...item, product: product ?? null };
            });

        res.json({
            share,
            ownerName: owner?.name ?? 'Anonymous',
            items
        });
    });

    return publicRouter;
}

// Expose notifications adder for price monitor
export { notifications, nextNotificationId };
