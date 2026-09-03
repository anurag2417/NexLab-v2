import express from 'express';
import { ReviewController } from './review.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// Get reviews for a course (public)
router.get('/course/:courseId', ReviewController.getCourseReviews);

// Protected routes (require authentication)
router.get('/course/:courseId/user', authenticate, ReviewController.getUserReview);
router.post('/course/:courseId', authenticate, ReviewController.create);
router.put('/:reviewId', authenticate, ReviewController.update);
router.delete('/:reviewId', authenticate, ReviewController.delete);

export default router;