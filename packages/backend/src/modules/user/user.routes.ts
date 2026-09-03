import express from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);
router.get('/stats', authenticate, UserController.getStats);
router.get('/activity', authenticate, UserController.getActivity);

export default router;