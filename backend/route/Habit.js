import express from 'express';
import { createHabit } from '../controllers/Habits/createHabit.js';
import { getHabits } from '../controllers/Habits/getHabits.js';
import { getHabit } from '../controllers/Habits/getHabit.js';
import { updateHabit } from '../controllers/Habits/updateHabit.js';
import { completeHabit } from '../controllers/Habits/completeHabit.js';
import { uncompleteHabit } from '../controllers/Habits/uncompleteHabit.js';
import { deleteHabit } from '../controllers/Habits/deleteHabit.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.post('/', createHabit);
router.get('/', getHabits);
router.get('/:id', getHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

// Complete habit
router.post('/:id/complete', completeHabit);
router.delete('/:id/complete', uncompleteHabit);

export default router;