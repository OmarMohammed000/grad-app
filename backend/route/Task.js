import express from 'express';
import authMiddleware from '../middleware/auth.js';
import createTask from '../controllers/Task/createTask.js';
import getTasks from '../controllers/Task/getTasks.js';
import getTask from '../controllers/Task/getTask.js';
import updateTask from '../controllers/Task/updateTask.js';
import completeTask from '../controllers/Task/completeTask.js';
import deleteTask from '../controllers/Task/deleteTask.js';

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

/**
 * Task Routes
 * All operations are user-specific (scoped to req.user.userId)
 */

// Create a new task
// POST /tasks
router.post('/', createTask);

// Get all tasks for current user (with filters, pagination, search)
// GET /tasks?status=active&priority=high&page=1&limit=20&search=workout
router.get('/', getTasks);

// Get single task by ID (user-specific)
// GET /tasks/:id
router.get('/:id', getTask);

// Update task (user-specific)
// PUT /tasks/:id
router.put('/:id', updateTask);

// Complete a task (awards XP)
// POST /tasks/:id/complete
router.post('/:id/complete', completeTask);

// Delete task (soft delete by default, permanent with ?permanent=true)
// DELETE /tasks/:id
// DELETE /tasks/:id?permanent=true
router.delete('/:id', deleteTask);

export default router;
