// packages/backend/src/modules/problems/problem.import.routes.ts

import express from 'express';
import { ProblemImportController } from './problem.import.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get import template
router.get('/template', ProblemImportController.getTemplate);

// Validate JSON without importing
router.post('/validate', ProblemImportController.validateJSON);

// Import problems
router.post('/import', ProblemImportController.importProblems);

// Export problems
router.post('/export', ProblemImportController.exportProblems);

export default router;