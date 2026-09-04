import express from 'express';
import { ProblemController } from './problem.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// ---------- Student Routes ----------
// Get all problems (published only)
router.get('/', ProblemController.getProblems);

// ✅ Get user's submissions - MUST BE BEFORE /:slug ROUTE
router.get('/submissions', authenticate, ProblemController.getSubmissions);

// Get problem by slug
router.get('/:slug', authenticate, ProblemController.getProblem);

// Submit solution
router.post('/:slug/submit', authenticate, ProblemController.submitSolution);

// ---------- Admin Routes ----------
// Get all problems for admin (including unpublished)
router.get('/admin/all', authenticate, isAdmin, ProblemController.getAdminProblems);

// Create problem
router.post('/', authenticate, isAdmin, ProblemController.create);

// Get problem by ID (admin)
router.get('/admin/:problemId', authenticate, isAdmin, ProblemController.getProblemById);

// Update problem
router.put('/:problemId', authenticate, isAdmin, ProblemController.updateProblem);

// Delete problem
router.delete('/:problemId', authenticate, isAdmin, ProblemController.deleteProblem);

// Toggle publish
router.patch('/:problemId/publish', authenticate, isAdmin, ProblemController.togglePublish);

export default router;