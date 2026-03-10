/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: API endpoints for managing user wishlists
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Returns all wishlist items for a user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's email address
 *     responses:
 *       200:
 *         description: List of wishlist items for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Invalid or missing userId
 *   post:
 *     summary: Add a product to the wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Wishlist item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Invalid input
 *   delete:
 *     summary: Clear all wishlist items for a user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's email address
 *     responses:
 *       204:
 *         description: Wishlist cleared successfully
 *       400:
 *         description: Invalid or missing userId
 *
 * /api/wishlist/{wishlistItemId}:
 *   delete:
 *     summary: Remove a wishlist item by ID
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: wishlistItemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist item ID
 *     responses:
 *       204:
 *         description: Wishlist item removed successfully
 *       404:
 *         description: Wishlist item not found
 */

import express from 'express';
import { WishlistItem } from '../models/wishlist';

const router = express.Router();

let wishlistItems: WishlistItem[] = [];
let nextWishlistItemId = 1;

// Reset function for testing
export const resetWishlist = () => {
  wishlistItems = [];
  nextWishlistItemId = 1;
};

// GET /api/wishlist?userId=<email>
router.get('/', (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!userId) {
    res.status(400).send('userId is required');
    return;
  }
  const items = wishlistItems.filter(item => item.userId === userId);
  res.json(items);
});

// POST /api/wishlist
router.post('/', (req, res) => {
  const userId = typeof req.body.userId === 'string' ? req.body.userId.trim() : '';
  const productId = req.body.productId;

  if (!userId) {
    res.status(400).send('userId must be a non-empty string');
    return;
  }

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).send('productId must be a positive integer');
    return;
  }

  // No duplicates
  const existing = wishlistItems.find(
    item => item.userId === userId && item.productId === productId
  );
  if (existing) {
    res.status(201).json(existing);
    return;
  }

  const newItem: WishlistItem = {
    wishlistItemId: nextWishlistItemId++,
    userId,
    productId,
    addedAt: new Date().toISOString(),
  };
  wishlistItems.push(newItem);
  res.status(201).json(newItem);
});

// DELETE /api/wishlist/:wishlistItemId
router.delete('/:wishlistItemId', (req, res) => {
  const wishlistItemId = parseInt(req.params.wishlistItemId);
  if (isNaN(wishlistItemId)) {
    res.status(400).send('wishlistItemId must be a valid integer');
    return;
  }
  const index = wishlistItems.findIndex(item => item.wishlistItemId === wishlistItemId);
  if (index !== -1) {
    wishlistItems.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).send('Wishlist item not found');
  }
});

// DELETE /api/wishlist?userId=<email>
router.delete('/', (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!userId) {
    res.status(400).send('userId is required');
    return;
  }
  wishlistItems = wishlistItems.filter(item => item.userId !== userId);
  res.status(204).send();
});

export default router;
