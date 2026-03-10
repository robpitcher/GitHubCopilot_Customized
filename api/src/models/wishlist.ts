/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - wishlistItemId
 *         - userId
 *         - productId
 *         - addedAt
 *         - priceAtTimeOfAdding
 *       properties:
 *         wishlistItemId:
 *           type: integer
 *           description: Unique identifier for the wishlist item
 *         userId:
 *           type: string
 *           description: Email of the user who added the item
 *         productId:
 *           type: integer
 *           description: ID of the product
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the item was added to the wishlist
 *         priceAtTimeOfAdding:
 *           type: number
 *           format: float
 *           description: Snapshot of the product price when it was added
 */

export interface WishlistItem {
  wishlistItemId: number;
  userId: string;
  productId: number;
  addedAt: string;
  priceAtTimeOfAdding: number;
}
