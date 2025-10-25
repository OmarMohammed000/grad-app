import express from 'express';
import authMiddleware from '../middleware/auth.js';
import createChallenge from '../controllers/Challenge/createChallenge.js';
import getChallenges from '../controllers/Challenge/getChallenges.js';
import getChallenge from '../controllers/Challenge/getChallenge.js';
import updateChallenge from '../controllers/Challenge/updateChallenge.js';
import deleteChallenge from '../controllers/Challenge/deleteChallenge.js';
import joinChallenge from '../controllers/Challenge/joinChallenge.js';
import leaveChallenge from '../controllers/Challenge/leaveChallenge.js';
import addChallengeTask from '../controllers/Challenge/addChallengeTask.js';
import completeChallengeTask from '../controllers/Challenge/completeChallengeTask.js';
import getChallengeLeaderboard from '../controllers/Challenge/getChallengeLeaderboard.js';
import getChallengeProgress from '../controllers/Challenge/getChallengeProgress.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Challenge CRUD
 */
// Create new challenge
router.post('/', createChallenge);

// Get all challenges (public + user's challenges)
// Query: ?status=active&challengeType=competitive&myChallenges=true&page=1&limit=20
router.get('/', getChallenges);

// Get single challenge
router.get('/:id', getChallenge);

// Update challenge (creator/moderator only)
router.put('/:id', updateChallenge);

// Delete/cancel challenge (creator only)
router.delete('/:id', deleteChallenge);

/**
 * Participation
 */
// Join a challenge
router.post('/:id/join', joinChallenge);

// Leave a challenge
router.post('/:id/leave', leaveChallenge);

/**
 * Challenge Tasks
 */
// Add task to challenge (creator/moderator only)
router.post('/:id/tasks', addChallengeTask);

// Complete a challenge task
router.post('/:challengeId/tasks/:taskId/complete', completeChallengeTask);

/**
 * Progress & Leaderboard
 */
// Get challenge leaderboard
router.get('/:id/leaderboard', getChallengeLeaderboard);

// Get user's progress in challenge
router.get('/:id/progress', getChallengeProgress);

export default router;
