/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       required:
 *         - wishlistId
 *         - userId
 *         - name
 *         - shareToken
 *         - createdAt
 *         - isPublic
 *       properties:
 *         wishlistId:
 *           type: integer
 *           description: The unique identifier for the wishlist
 *         userId:
 *           type: string
 *           description: The email of the user who owns the wishlist
 *         name:
 *           type: string
 *           description: The display name of the wishlist
 *         shareToken:
 *           type: string
 *           description: A unique token used for public sharing
 *         createdAt:
 *           type: string
 *           description: ISO timestamp when the wishlist was created
 *         isPublic:
 *           type: boolean
 *           description: Whether the wishlist is publicly accessible via share token
 *     WishlistItem:
 *       type: object
 *       required:
 *         - wishlistItemId
 *         - wishlistId
 *         - productId
 *         - addedAt
 *       properties:
 *         wishlistItemId:
 *           type: integer
 *           description: The unique identifier for the wishlist item
 *         wishlistId:
 *           type: integer
 *           description: The ID of the parent wishlist
 *         productId:
 *           type: integer
 *           description: The ID of the product added to the wishlist
 *         addedAt:
 *           type: string
 *           description: ISO timestamp when the item was added
 */
export interface Wishlist {
  wishlistId: number;
  userId: string;       // user email
  name: string;         // e.g. "Holiday shopping"
  shareToken: string;   // UUID-like random string for sharing
  createdAt: string;
  isPublic: boolean;
}

export interface WishlistItem {
  wishlistItemId: number;
  wishlistId: number;
  productId: number;
  addedAt: string;
}
