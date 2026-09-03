import express from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isAdmin } from '../../shared/middleware/admin.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.get('/students', authenticate, isAdmin, AdminController.getStudents);
router.get('/students/stats', authenticate, isAdmin, AdminController.getStudentStats);
router.get('/students/:id', authenticate, isAdmin, AdminController.getStudentDetails);
router.put('/students/:id', authenticate, isAdmin, AdminController.updateStudent);
router.delete('/students/:id', authenticate, isAdmin, AdminController.deleteStudent);

export default router;