/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - userId
 *         - email
 *         - name
 *         - passwordHash
 *       properties:
 *         userId:
 *           type: integer
 *           description: The unique identifier for the user
 *         email:
 *           type: string
 *           description: The user's email address (unique)
 *         name:
 *           type: string
 *           description: The user's display name
 *         passwordHash:
 *           type: string
 *           description: Bcrypt hash of the user's password
 *         notificationPreferences:
 *           type: object
 *           description: User's notification preference settings
 *         createdAt:
 *           type: string
 *           description: ISO date string when the user was created
 */
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    stockAlerts: boolean;
}

export interface User {
    userId: number;
    email: string; // unique
    name: string;
    passwordHash: string;
    notificationPreferences: NotificationPreferences;
    createdAt: string;
}
