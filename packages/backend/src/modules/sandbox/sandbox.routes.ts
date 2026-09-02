import express from 'express';
import { SandboxController } from './sandbox.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.post('/execute', authenticate, SandboxController.execute);

export default router;