import express from 'express';
import authMiddleware from '../middleware/auth.js';
import getNotifications from '../controllers/Notification/getNotifications.js';
import registerToken from '../controllers/Notification/registerToken.js';
import unregisterToken from '../controllers/Notification/unregisterToken.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', getNotifications);

// Register device push token
router.post('/register', registerToken);

// Unregister device push token
router.post('/unregister', unregisterToken);

export default router;
