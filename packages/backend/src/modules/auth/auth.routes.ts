import express from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

console.log('🔐 Setting up auth routes...');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Protected route - requires authentication
router.get('/me', authenticate, AuthController.me);

console.log('✅ Auth routes configured');

export default router;