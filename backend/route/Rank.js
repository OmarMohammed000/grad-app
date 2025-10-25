// backend/route/Rank.js
import express from 'express';
import getRanks from '../controllers/Rank/getRanks.js';

const router = express.Router();

// Public endpoint - no auth required (used for UI reference)
router.get('/', getRanks);

export default router;