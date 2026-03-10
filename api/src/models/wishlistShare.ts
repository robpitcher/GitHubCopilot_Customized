/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistShare:
 *       type: object
 *       required:
 *         - shareId
 *         - wishlistId
 *         - userId
 *         - shareToken
 *         - isPublic
 *         - viewCount
 *         - createdAt
 *       properties:
 *         shareId:
 *           type: integer
 *           description: The unique identifier for the share
 *         wishlistId:
 *           type: integer
 *           description: The wishlist being shared (maps to userId)
 *         userId:
 *           type: integer
 *           description: The owner of the shared wishlist
 *         shareToken:
 *           type: string
 *           description: Unique token for public link access
 *         isPublic:
 *           type: boolean
 *           description: Whether the share is publicly accessible
 *         expiresAt:
 *           type: string
 *           description: Optional ISO date string when the share expires
 *         viewCount:
 *           type: integer
 *           description: Number of times the share link has been viewed
 *         createdAt:
 *           type: string
 *           description: ISO date string when the share was created
 */
export interface WishlistShare {
    shareId: number;
    wishlistId: number; // maps to userId (one wishlist per user)
    userId: number;     // owner
    shareToken: string; // unique
    isPublic: boolean;
    expiresAt?: string;
    viewCount: number;
    createdAt: string;
}
