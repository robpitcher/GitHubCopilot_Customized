/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: API endpoints for managing named wishlists
 */

/**
 * @swagger
 * /api/wishlists:
 *   get:
 *     summary: Returns all wishlists for a user
 *     tags: [Wishlists]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User email
 *     responses:
 *       200:
 *         description: List of wishlists for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Missing userId query parameter
 *   post:
 *     summary: Create a new wishlist
 *     tags: [Wishlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wishlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Invalid input
 *
 * /api/wishlists/share/{token}:
 *   get:
 *     summary: Get a public wishlist by share token
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Share token
 *     responses:
 *       200:
 *         description: Wishlist and its items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wishlist:
 *                   $ref: '#/components/schemas/Wishlist'
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishlistItem'
 *       404:
 *         description: Wishlist not found or not public
 *
 * /api/wishlists/{wishlistId}:
 *   put:
 *     summary: Update a wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Wishlist not found
 *   delete:
 *     summary: Delete a wishlist and all its items
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist ID
 *     responses:
 *       204:
 *         description: Wishlist deleted successfully
 *       404:
 *         description: Wishlist not found
 *
 * /api/wishlists/{wishlistId}/items:
 *   get:
 *     summary: List items in a wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist ID
 *     responses:
 *       200:
 *         description: List of wishlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 *       404:
 *         description: Wishlist not found
 *   post:
 *     summary: Add a product to a wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist ID
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
 *         description: Item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Invalid input or duplicate item
 *       404:
 *         description: Wishlist not found
 *
 * /api/wishlists/{wishlistId}/items/{wishlistItemId}:
 *   delete:
 *     summary: Remove an item from a wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist ID
 *       - in: path
 *         name: wishlistItemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist item ID
 *     responses:
 *       204:
 *         description: Item removed successfully
 *       404:
 *         description: Item not found
 */

import express from 'express';
import { Wishlist, WishlistItem } from '../models/wishlist';

const router = express.Router();

let wishlists: Wishlist[] = [];
let wishlistItems: WishlistItem[] = [];
let nextWishlistId = 1;
let nextWishlistItemId = 1;

// Add reset function for testing
export const resetWishlists = () => {
  wishlists = [];
  wishlistItems = [];
  nextWishlistId = 1;
  nextWishlistItemId = 1;
};

// Generate a simple share token
const generateShareToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// GET /api/wishlists/share/:token — must be defined before /:wishlistId routes
router.get('/share/:token', (req, res) => {
  const { token } = req.params;
  const wishlist = wishlists.find(w => w.shareToken === token);
  if (!wishlist || !wishlist.isPublic) {
    return res.status(404).send('Wishlist not found or not public');
  }
  const items = wishlistItems.filter(i => i.wishlistId === wishlist.wishlistId);
  return res.json({ wishlist, items });
});

// GET /api/wishlists?userId=<email>
router.get('/', (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).send('userId query parameter is required');
  }
  const userWishlists = wishlists.filter(w => w.userId === userId);
  return res.json(userWishlists);
});

// POST /api/wishlists — body: { userId, name }
router.post('/', (req, res) => {
  const { userId, name } = req.body;
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).send('userId is required');
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).send('name is required');
  }
  if (name.length > 100) {
    return res.status(400).send('name must be 100 characters or fewer');
  }
  const newWishlist: Wishlist = {
    wishlistId: nextWishlistId++,
    userId: userId.trim(),
    name: name.trim(),
    shareToken: generateShareToken(),
    createdAt: new Date().toISOString(),
    isPublic: false,
  };
  wishlists.push(newWishlist);
  return res.status(201).json(newWishlist);
});

// PUT /api/wishlists/:wishlistId — update name or isPublic
router.put('/:wishlistId', (req, res) => {
  const wishlistId = parseInt(req.params.wishlistId);
  const index = wishlists.findIndex(w => w.wishlistId === wishlistId);
  if (index === -1) {
    return res.status(404).send('Wishlist not found');
  }
  const { name, isPublic } = req.body;
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).send('name must be a non-empty string');
    }
    if (name.length > 100) {
      return res.status(400).send('name must be 100 characters or fewer');
    }
    wishlists[index].name = name.trim();
  }
  if (isPublic !== undefined) {
    wishlists[index].isPublic = Boolean(isPublic);
  }
  return res.json(wishlists[index]);
});

// DELETE /api/wishlists/:wishlistId — delete wishlist and its items
router.delete('/:wishlistId', (req, res) => {
  const wishlistId = parseInt(req.params.wishlistId);
  const index = wishlists.findIndex(w => w.wishlistId === wishlistId);
  if (index === -1) {
    return res.status(404).send('Wishlist not found');
  }
  wishlists.splice(index, 1);
  wishlistItems = wishlistItems.filter(i => i.wishlistId !== wishlistId);
  return res.status(204).send();
});

// GET /api/wishlists/:wishlistId/items
router.get('/:wishlistId/items', (req, res) => {
  const wishlistId = parseInt(req.params.wishlistId);
  const wishlist = wishlists.find(w => w.wishlistId === wishlistId);
  if (!wishlist) {
    return res.status(404).send('Wishlist not found');
  }
  const items = wishlistItems.filter(i => i.wishlistId === wishlistId);
  return res.json(items);
});

// POST /api/wishlists/:wishlistId/items — body: { productId }
router.post('/:wishlistId/items', (req, res) => {
  const wishlistId = parseInt(req.params.wishlistId);
  const wishlist = wishlists.find(w => w.wishlistId === wishlistId);
  if (!wishlist) {
    return res.status(404).send('Wishlist not found');
  }
  const { productId } = req.body;
  if (!productId || typeof productId !== 'number') {
    return res.status(400).send('productId is required and must be a number');
  }
  const duplicate = wishlistItems.find(
    i => i.wishlistId === wishlistId && i.productId === productId
  );
  if (duplicate) {
    return res.status(400).send('Product already in wishlist');
  }
  const newItem: WishlistItem = {
    wishlistItemId: nextWishlistItemId++,
    wishlistId,
    productId,
    addedAt: new Date().toISOString(),
  };
  wishlistItems.push(newItem);
  return res.status(201).json(newItem);
});

// DELETE /api/wishlists/:wishlistId/items/:wishlistItemId
router.delete('/:wishlistId/items/:wishlistItemId', (req, res) => {
  const wishlistId = parseInt(req.params.wishlistId);
  const wishlistItemId = parseInt(req.params.wishlistItemId);
  const index = wishlistItems.findIndex(
    i => i.wishlistId === wishlistId && i.wishlistItemId === wishlistItemId
  );
  if (index === -1) {
    return res.status(404).send('Wishlist item not found');
  }
  wishlistItems.splice(index, 1);
  return res.status(204).send();
});

export default router;
