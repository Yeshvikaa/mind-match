import express from 'express';
import { register, login, guestLogin, getProfile, updateProfile } from '../controllers/authController.js';
import { saveGameSession, getStats, getLeaderboard } from '../controllers/gameController.js';
import { getActiveChallenges, submitChallengeCompletion } from '../controllers/challengeController.js';
import { getAdminOverview, getAllUsers, publishChallenge, deleteUser } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/guest', guestLogin);
router.get('/auth/profile', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);

// Game & Stats Routes
router.post('/game/session', protect, saveGameSession);
router.get('/game/stats', protect, getStats);
router.get('/game/leaderboard', getLeaderboard);

// Daily Challenges Routes
router.get('/challenges', protect, getActiveChallenges);
router.post('/challenges/:id/complete', protect, submitChallengeCompletion);

// Admin Routes
router.get('/admin/overview', protect, adminOnly, getAdminOverview);
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.post('/admin/challenges', protect, adminOnly, publishChallenge);
router.delete('/admin/users/:id', protect, adminOnly, deleteUser);

export default router;
