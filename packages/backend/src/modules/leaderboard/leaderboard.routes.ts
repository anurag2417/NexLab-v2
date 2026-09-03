import express from 'express';
import { LeaderboardController } from './leaderboard.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// Get leaderboard (authenticated)
router.get('/', authenticate, LeaderboardController.getLeaderboard);

// Update user score (authenticated)
router.post('/update', authenticate, LeaderboardController.updateScore);

// Rebuild leaderboard (admin only)
router.post('/rebuild', authenticate, isAdmin, LeaderboardController.rebuild);

export default router;