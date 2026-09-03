import express from 'express';
import { ProblemController } from './problem.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// ---------- Student Routes ----------
router.get('/', ProblemController.getProblems);
router.get('/:slug', authenticate, ProblemController.getProblem);
router.post('/:slug/submit', authenticate, ProblemController.submitSolution);

// ---------- Admin Routes ----------
router.get('/admin/all', authenticate, isAdmin, ProblemController.getAdminProblems);
router.get('/admin/:problemId', authenticate, isAdmin, ProblemController.getProblemById);
router.post('/', authenticate, isAdmin, ProblemController.create);
router.put('/:problemId', authenticate, isAdmin, ProblemController.updateProblem);
router.delete('/:problemId', authenticate, isAdmin, ProblemController.deleteProblem);
router.patch('/:problemId/publish', authenticate, isAdmin, ProblemController.togglePublish);

export default router;