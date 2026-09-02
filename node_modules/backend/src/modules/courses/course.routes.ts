import express from 'express';
import { CourseController } from './course.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';


const router = express.Router();

// Public routes
router.get('/', CourseController.getAll);
router.get('/popular', CourseController.getPopular);
router.get('/:id', CourseController.getOne);

// Admin only routes
router.post('/', authenticate, isAdmin, CourseController.create);
router.put('/:id', authenticate, isAdmin, CourseController.update);
router.delete('/:id', authenticate, isAdmin, CourseController.delete);
router.patch('/:id/publish', authenticate, isAdmin, CourseController.togglePublish);

export default router;