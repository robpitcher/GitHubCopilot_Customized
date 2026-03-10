/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *       properties:
 *         wishlistItemId:
 *           type: integer
 *         userId:
 *           type: string
 *           description: The user's email address used as identifier
 *         productId:
 *           type: integer
 *         addedAt:
 *           type: string
 *           format: date-time
 */
export interface WishlistItem {
  wishlistItemId: number;
  userId: string;
  productId: number;
  addedAt: string;
}
