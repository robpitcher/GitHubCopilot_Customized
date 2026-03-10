/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - wishlistId
 *         - userId
 *         - productId
 *         - addedAt
 *       properties:
 *         wishlistId:
 *           type: integer
 *           description: The unique identifier for the wishlist item
 *         userId:
 *           type: integer
 *           description: The ID of the user who owns this wishlist item
 *         productId:
 *           type: integer
 *           description: The ID of the product added to the wishlist
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: ISO date string when the product was added to the wishlist
 */
export interface WishlistItem {
  wishlistId: number;
  userId: number;
  productId: number;
  addedAt: string;
}
