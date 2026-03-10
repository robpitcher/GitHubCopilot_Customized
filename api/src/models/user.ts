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
 *         - createdAt
 *       properties:
 *         userId:
 *           type: integer
 *           description: The unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address (unique)
 *         name:
 *           type: string
 *           description: The user's display name
 *         passwordHash:
 *           type: string
 *           description: Bcrypt hash of the user's password
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: ISO date string when the user was created
 */
export interface User {
  userId: number;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}
