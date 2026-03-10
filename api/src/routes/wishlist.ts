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
 *     summary: Returns all wishlist items for a user, enriched with current product data
 *     tags: [Wishlist]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User email
 *     responses:
 *       200:
 *         description: List of wishlist items with current product data and price drop info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: userId is required
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
 *         description: Item added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product not found
 *       409:
 *         description: Item already in wishlist
 *   delete:
 *     summary: Clear all wishlist items for a user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User email
 *     responses:
 *       204:
 *         description: Wishlist cleared
 *       400:
 *         description: userId is required
 *
 * /api/wishlist/{wishlistItemId}:
 *   delete:
 *     summary: Remove a specific item from the wishlist
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
 *         description: Item removed from wishlist
 *       404:
 *         description: Wishlist item not found
 */

import express from 'express';
import { WishlistItem } from '../models/wishlist';
import { products } from '../seedData';

const router = express.Router();

let wishlistItems: WishlistItem[] = [];
let nextId = 1;

// Add reset function for testing
export const resetWishlist = () => {
  wishlistItems = [];
  nextId = 1;
};

// GET /api/wishlist?userId=<email> — returns all wishlist items for a user enriched with product data
router.get('/', (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!userId) {
    return res.status(400).send('userId is required');
  }

  const userItems = wishlistItems.filter(item => item.userId === userId);
  const enriched = userItems.map(item => {
    const product = products.find(p => p.productId === item.productId);
    if (!product) return item;
    const currentPrice = product.discount
      ? product.price * (1 - product.discount)
      : product.price;
    return {
      ...item,
      name: product.name,
      currentPrice,
      imgName: product.imgName,
      discount: product.discount,
      sku: product.sku,
      priceDrop: item.priceAtTimeOfAdding - currentPrice,
    };
  });

  return res.json(enriched);
});

// POST /api/wishlist — add a product to the wishlist
router.post('/', (req, res) => {
  const { userId: rawUserId, productId } = req.body;

  const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';
  if (!userId) {
    return res.status(400).send('userId is required');
  }

  const parsedProductId = typeof productId === 'number' ? productId : parseInt(productId, 10);
  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).send('productId must be a positive integer');
  }

  const product = products.find(p => p.productId === parsedProductId);
  if (!product) {
    return res.status(404).send('Product not found');
  }

  const duplicate = wishlistItems.find(item => item.userId === userId && item.productId === parsedProductId);
  if (duplicate) {
    return res.status(409).send('Item already in wishlist');
  }

  const currentPrice = product.discount
    ? product.price * (1 - product.discount)
    : product.price;

  const newItem: WishlistItem = {
    wishlistItemId: nextId++,
    userId,
    productId: parsedProductId,
    addedAt: new Date().toISOString(),
    priceAtTimeOfAdding: currentPrice,
  };

  wishlistItems.push(newItem);
  return res.status(201).json(newItem);
});

// DELETE /api/wishlist/:wishlistItemId — remove a specific wishlist item
router.delete('/:wishlistItemId', (req, res) => {
  const wishlistItemId = parseInt(req.params.wishlistItemId, 10);
  const index = wishlistItems.findIndex(item => item.wishlistItemId === wishlistItemId);
  if (index === -1) {
    return res.status(404).send('Wishlist item not found');
  }
  wishlistItems.splice(index, 1);
  return res.status(204).send();
});

// DELETE /api/wishlist?userId=<email> — clear all wishlist items for a user
router.delete('/', (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!userId) {
    return res.status(400).send('userId is required');
  }
  wishlistItems = wishlistItems.filter(item => item.userId !== userId);
  return res.status(204).send();
});

export default router;
