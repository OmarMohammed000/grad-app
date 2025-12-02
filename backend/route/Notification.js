import express from 'express';
import authMiddleware from '../middleware/auth.js';
import getNotifications from '../controllers/Notification/getNotifications.js';
import registerToken from '../controllers/Notification/registerToken.js';
import unregisterToken from '../controllers/Notification/unregisterToken.js';
import markNotificationRead from '../controllers/Notification/markNotificationRead.js';
import markAllNotificationsRead from '../controllers/Notification/markAllNotificationsRead.js';
import deleteNotification from '../controllers/Notification/deleteNotification.js';
import getNotificationPreferences from '../controllers/Notification/getNotificationPreferences.js';
import updateNotificationPreferences from '../controllers/Notification/updateNotificationPreferences.js';
import createTestNotification from '../controllers/Notification/createTestNotification.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', getNotifications);

// Register device push token
router.post('/register', registerToken);

// Unregister device push token
router.post('/unregister', unregisterToken);

// Mark notification as read
router.patch('/:id/read', markNotificationRead);

// Mark all notifications as read
router.post('/mark-all-read', markAllNotificationsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Get notification preferences
router.get('/preferences', getNotificationPreferences);

// Update notification preferences
router.put('/preferences', updateNotificationPreferences);

// Test notification (development only)
router.post('/test', createTestNotification);

export default router;
