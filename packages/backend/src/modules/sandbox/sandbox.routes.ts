import express from 'express';
import { SandboxController } from './sandbox.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

//console.log('🏖️ Setting up sandbox routes...');

// Get available languages (public)
router.get('/languages', SandboxController.getLanguages);

// Execute code (requires authentication)
router.post('/execute', authenticate, SandboxController.execute);

//console.log('✅ Sandbox routes configured');

export default router;