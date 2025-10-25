import express from 'express';
import { getGlobalLeaderboard } from '../controllers/Leaderboard/getGloballeaderboard.js';
import { getUserStats } from '../controllers/Leaderboard/getUserStats.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public leaderboard (optionally protected)
router.get('/', authMiddleware, getGlobalLeaderboard);

// User stats (me or specific user)
router.get('/users/:id/stats', authMiddleware, getUserStats);

export default router;