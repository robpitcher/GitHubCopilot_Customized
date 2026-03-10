/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management for authenticated users
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get current user's wishlist with full product details
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlist items with product details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   wishlistId:
 *                     type: integer
 *                   productId:
 *                     type: integer
 *                   addedAt:
 *                     type: string
 *                     format: date-time
 *                   product:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add a product to the current user's wishlist
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
 *         description: Product added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Product already in wishlist or invalid productId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from the current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to remove from wishlist
 *     responses:
 *       204:
 *         description: Product removed from wishlist
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found in wishlist
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { WishlistItem } from '../models/wishlist';
import { wishlistItems as seedWishlistItems } from '../seedData';
import { products as seedProducts } from '../seedData';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

export let wishlistItems: WishlistItem[] = [...seedWishlistItems];
let products = [...seedProducts];

const wishlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All wishlist endpoints require authentication (rate limiting applied first)
router.use(wishlistLimiter);
router.use(authMiddleware);

// GET /api/wishlist - Get current user's wishlist with full product details
router.get('/', (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const userWishlist = wishlistItems.filter(item => item.userId === userId);
  const result = userWishlist.map(item => ({
    ...item,
    product: products.find(p => p.productId === item.productId) || null,
  }));
  res.json(result);
});

// POST /api/wishlist - Add product to wishlist
router.post('/', (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { productId } = req.body;

  if (!productId || typeof productId !== 'number') {
    res.status(400).json({ message: 'productId is required and must be a number' });
    return;
  }

  const product = products.find(p => p.productId === productId);
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  const alreadyInWishlist = wishlistItems.find(
    item => item.userId === userId && item.productId === productId
  );
  if (alreadyInWishlist) {
    res.status(400).json({ message: 'Product already in wishlist' });
    return;
  }

  const newItem: WishlistItem = {
    wishlistId:
      wishlistItems.length > 0
        ? Math.max(...wishlistItems.map(i => i.wishlistId)) + 1
        : 1,
    userId,
    productId,
    addedAt: new Date().toISOString(),
  };

  wishlistItems.push(newItem);
  res.status(201).json(newItem);
});

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete('/:productId', (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const productId = parseInt(req.params.productId, 10);

  const index = wishlistItems.findIndex(
    item => item.userId === userId && item.productId === productId
  );

  if (index === -1) {
    res.status(404).json({ message: 'Product not found in wishlist' });
    return;
  }

  wishlistItems.splice(index, 1);
  res.status(204).send();
});

export default router;
