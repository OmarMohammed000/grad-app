import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import listUsers from '../controllers/Admin/listUsers.js';
import getUser from '../controllers/Admin/getUser.js';
import createUser from '../controllers/Admin/createUser.js';
import updateUser from '../controllers/Admin/updateUser.js';
import deleteUser from '../controllers/Admin/deleteUser.js';
import updateUserRole from '../controllers/Admin/updateUserRole.js';
import getUserStatsAdmin from '../controllers/Admin/getUserStatsAdmin.js';
import getUserActivityAdmin from '../controllers/Admin/getUserActivityAdmin.js';
import getUserChallenges from '../controllers/Admin/getUserChallenges.js';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authMiddleware, requireAdmin);

// User management
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);

// User analytics (admin-specific, bypasses privacy)
router.get('/users/:id/stats', getUserStatsAdmin);
router.get('/users/:id/activity', getUserActivityAdmin);
router.get('/users/:id/challenges', getUserChallenges);

export default router;
