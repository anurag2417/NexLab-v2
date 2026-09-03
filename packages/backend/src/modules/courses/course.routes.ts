import express from 'express';
import { CourseController } from './course.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// ---------- Public Routes (Student) ----------
// Get all published courses
router.get('/published', CourseController.getAllPublished);

// Get popular courses
router.get('/popular', CourseController.getAllPublished);

// Get single course by ID
router.get('/:id', CourseController.getOne);

// ---------- Protected Routes (Student - Auth Required) ----------
// Enroll in a course
router.post('/:courseId/enroll', authenticate, CourseController.enroll);

// Get course progress
router.get('/:courseId/progress', authenticate, CourseController.getProgress);

// Mark lesson as complete
router.post('/:courseId/:lessonId/complete', authenticate, CourseController.completeLesson);

// ---------- Admin Only Routes ----------
// Get all courses (admin view)
router.get('/admin/all', authenticate, isAdmin, CourseController.getAllAdmin);

// Create a new course
router.post('/', authenticate, isAdmin, CourseController.create);

// Update a course
router.put('/:id', authenticate, isAdmin, CourseController.update);

// Delete a course
router.delete('/:id', authenticate, isAdmin, CourseController.delete);

// Toggle publish status
router.patch('/:id/publish', authenticate, isAdmin, CourseController.togglePublish);

export default router;