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
 *         - priority
 *         - priceWhenAdded
 *         - notifyOnPriceDrop
 *         - notifyOnStock
 *       properties:
 *         wishlistId:
 *           type: integer
 *           description: The unique identifier for the wishlist entry
 *         userId:
 *           type: integer
 *           description: The user who owns this wishlist item
 *         productId:
 *           type: integer
 *           description: The product being wishlisted
 *         addedAt:
 *           type: string
 *           description: ISO date string when the item was added
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Priority level of the wishlist item
 *         notes:
 *           type: string
 *           description: Optional personal notes about the item
 *         priceWhenAdded:
 *           type: number
 *           description: Product price at the time of adding to wishlist
 *         notifyOnPriceDrop:
 *           type: boolean
 *           description: Whether to notify when price drops
 *         notifyOnStock:
 *           type: boolean
 *           description: Whether to notify when back in stock
 */
export interface WishlistItem {
    wishlistId: number;
    userId: number;
    productId: number;
    addedAt: string;
    priority: 'low' | 'medium' | 'high';
    notes?: string;
    priceWhenAdded: number;
    notifyOnPriceDrop: boolean;
    notifyOnStock: boolean;
}
