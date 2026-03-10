/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 *
 * /api/notifications/test:
 *   post:
 *     summary: Create a test notification (dev only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [price_drop, stock_alert, recommendation]
 *               productId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Test notification created
 */

import express from 'express';
import { notifications, nextNotificationId } from '../store';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models/notification';

const router = express.Router();

router.use(requireAuth);

// GET /api/notifications
router.get('/', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const userNotifications = notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userNotifications);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const notifId = parseInt(req.params.id);
    const notif = notifications.find(n => n.notificationId === notifId && n.userId === userId);
    if (!notif) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    notif.read = true;
    res.json(notif);
});

// DELETE /api/notifications/:id
router.delete('/:id', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const notifId = parseInt(req.params.id);
    const index = notifications.findIndex(n => n.notificationId === notifId && n.userId === userId);
    if (index === -1) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    notifications.splice(index, 1);
    res.status(204).send();
});

// POST /api/notifications/test (dev only)
router.post('/test', (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { type = 'recommendation', productId = 1, message = 'Test notification' } =
        req.body as Partial<Notification>;

    const allowedTypes = ['price_drop', 'stock_alert', 'recommendation'] as const;
    const notifType = allowedTypes.includes(type as typeof allowedTypes[number])
        ? (type as typeof allowedTypes[number])
        : 'recommendation';

    const newNotif: Notification = {
        notificationId: nextNotificationId(),
        userId,
        type: notifType,
        productId: Number(productId) || 1,
        message: String(message),
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(newNotif);
    res.status(201).json(newNotif);
});

export default router;
