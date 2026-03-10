/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - notificationId
 *         - userId
 *         - type
 *         - productId
 *         - message
 *         - read
 *         - createdAt
 *       properties:
 *         notificationId:
 *           type: integer
 *           description: The unique identifier for the notification
 *         userId:
 *           type: integer
 *           description: The user who receives the notification
 *         type:
 *           type: string
 *           enum: [price_drop, stock_alert, recommendation]
 *           description: Type of notification
 *         productId:
 *           type: integer
 *           description: The product this notification is about
 *         message:
 *           type: string
 *           description: Human-readable notification message
 *         read:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           description: ISO date string when the notification was created
 */
export interface Notification {
    notificationId: number;
    userId: number;
    type: 'price_drop' | 'stock_alert' | 'recommendation';
    productId: number;
    message: string;
    read: boolean;
    createdAt: string;
}
