/**
 * @swagger
 * components:
 *   schemas:
 *     PriceHistory:
 *       type: object
 *       required:
 *         - priceHistoryId
 *         - productId
 *         - price
 *         - recordedAt
 *       properties:
 *         priceHistoryId:
 *           type: integer
 *           description: The unique identifier for the price record
 *         productId:
 *           type: integer
 *           description: The product this price record belongs to
 *         price:
 *           type: number
 *           description: The price recorded at this point in time
 *         recordedAt:
 *           type: string
 *           description: ISO date string when the price was recorded
 */
export interface PriceHistory {
    priceHistoryId: number;
    productId: number;
    price: number;
    recordedAt: string;
}
