import express from 'express';
import authMiddleware from '../middleware/auth.js';
import getMe from '../controllers/User/getMe.js';
import updateMe from '../controllers/User/updateMe.js';
import updatePassword from '../controllers/User/updatePassword.js';
import deleteMe from '../controllers/User/deleteMe.js';
import getUserProfile from '../controllers/User/getUserProfile.js';

const router = express.Router();

// Public routes
router.get('/:id/profile', getUserProfile);

// Protected routes (require authentication)
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.put('/me/password', authMiddleware, updatePassword);
router.delete('/me', authMiddleware, deleteMe);

export default router;
