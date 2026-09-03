import express from 'express';
import { AdminController } from './admin.controller.js';
import { AdminAnalyticsController } from './admin.analytics.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// Student Management Routes
router.get('/students', authenticate, isAdmin, AdminController.getStudents);
router.get('/students/stats', authenticate, isAdmin, AdminController.getStudentStats);
router.get('/students/:id', authenticate, isAdmin, AdminController.getStudentDetails);
router.put('/students/:id', authenticate, isAdmin, AdminController.updateStudent);
router.delete('/students/:id', authenticate, isAdmin, AdminController.deleteStudent);

// Analytics Routes
router.get('/analytics/overview', authenticate, isAdmin, AdminAnalyticsController.getOverview);
router.get('/analytics/courses', authenticate, isAdmin, AdminAnalyticsController.getCourseAnalytics);
router.get('/analytics/students', authenticate, isAdmin, AdminAnalyticsController.getStudentAnalytics);
router.get('/analytics/revenue', authenticate, isAdmin, AdminAnalyticsController.getRevenueAnalytics);
router.get('/analytics/engagement', authenticate, isAdmin, AdminAnalyticsController.getEngagementAnalytics);

export default router;