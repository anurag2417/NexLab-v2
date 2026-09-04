import express from 'express';
import { SandboxController } from './sandbox.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// Get available languages (public)
router.get('/languages', SandboxController.getLanguages);

// Execute code (requires authentication)
// ✅ Removed rate limiter
router.post('/execute', authenticate, SandboxController.execute);

export default router;