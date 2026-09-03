import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { CourseService } from './course.service.js';
import { User } from '../auth/auth.model.js';

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  category: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0).default(0),
  lessons: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    videoUrl: z.string().url(),
    duration: z.number().optional(),
    order: z.number(),
    isFree: z.boolean().default(false),
  })),
});

const updateCourseSchema = createCourseSchema.partial();

export class CourseController {
  // ---------- Create Course ----------
  static async create(req: Request, res: Response) {
    try {
      const data = createCourseSchema.parse(req.body);
      
      const course = await CourseService.createCourse({
        ...data,
        instructor: new Types.ObjectId(req.userId),
      });

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully',
      });
    } catch (error: any) {
      console.error('Create course error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course',
      });
    }
  }

  // ---------- Get All Courses (Admin) ----------
  static async getAllAdmin(req: Request, res: Response) {
    try {
      const courses = await CourseService.getAllCourses();
      res.status(200).json({
        success: true,
        data: courses,
        count: courses.length,
      });
    } catch (error: any) {
      console.error('Get admin courses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch courses',
      });
    }
  }

  // ---------- Get All Published Courses (Student) ----------
  static async getAllPublished(req: Request, res: Response) {
    try {
      const { category, level, search } = req.query;
      
      const courses = await CourseService.getCourses({
        category: category as string,
        level: level as string,
        isPublished: true,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: courses,
        count: courses.length,
      });
    } catch (error: any) {
      console.error('Get published courses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch courses',
      });
    }
  }

  // ---------- Get Single Course ----------
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const course = await CourseService.getCourseById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error: any) {
      console.error('Get course error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch course',
      });
    }
  }

  // ---------- Update Course ----------
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateCourseSchema.parse(req.body);
      
      const course = await CourseService.updateCourse(id, data);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        data: course,
        message: 'Course updated successfully',
      });
    } catch (error: any) {
      console.error('Update course error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course',
      });
    }
  }

  // ---------- Delete Course ----------
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deleted = await CourseService.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course',
      });
    }
  }

  // ---------- Toggle Publish ----------
  static async togglePublish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const course = await CourseService.togglePublish(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      res.status(200).json({
        success: true,
        data: course,
        message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
      });
    } catch (error: any) {
      console.error('Toggle publish error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle publish status',
      });
    }
  }

  // ---------- Enroll Student in Course ----------
  static async enroll(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.userId;

      const course = await CourseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      if (!course.isPublished) {
        return res.status(400).json({
          success: false,
          message: 'This course is not yet available',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const alreadyEnrolled = user.enrolledCourses?.some(id => id.toString() === courseId);
      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this course',
        });
      }

      if (!user.enrolledCourses) {
        user.enrolledCourses = [];
      }
      user.enrolledCourses.push(new Types.ObjectId(courseId));
      await user.save();

      const success = await CourseService.enrollStudent(courseId, userId);
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to enroll in course',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Successfully enrolled in course',
      });
    } catch (error: any) {
      console.error('Enrollment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to enroll in course',
      });
    }
  }

  // ---------- Get Student's Course Progress ----------
  static async getProgress(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const course = await CourseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const progressKey = `progress:${courseId}`;
      const completedLessons = user.progress?.get(progressKey) || [];
      const totalLessons = course.lessons?.length || 0;
      
      res.status(200).json({
        success: true,
        data: {
          completedLessons: completedLessons.length,
          totalLessons: totalLessons,
          percentage: totalLessons > 0 
            ? Math.round((completedLessons.length / totalLessons) * 100) 
            : 0,
          completedLessonIds: completedLessons,
        },
      });
    } catch (error: any) {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch progress',
      });
    }
  }

  // ---------- Mark Lesson as Complete ----------
  static async completeLesson(req: Request, res: Response) {
    try {
      const { courseId, lessonId } = req.params;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const course = await CourseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const lessonExists = course.lessons?.some(l => l._id?.toString() === lessonId);
      if (!lessonExists) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found in this course',
        });
      }

      if (!user.progress) {
        user.progress = new Map();
      }

      const progressKey = `progress:${courseId}`;
      if (!user.progress.has(progressKey)) {
        user.progress.set(progressKey, []);
      }

      const completedLessons = user.progress.get(progressKey) || [];
      
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        user.progress.set(progressKey, completedLessons);
        
        const xpGain = 10;
        user.xp = (user.xp || 0) + xpGain;
        
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: 'Lesson marked as complete',
        data: {
          xpEarned: 10,
          totalXp: user.xp,
          level: user.level,
          completedLessons: completedLessons.length,
          totalLessons: course.lessons?.length || 0,
          percentage: course.lessons?.length > 0 
            ? Math.round((completedLessons.length / course.lessons.length) * 100) 
            : 0,
        },
      });
    } catch (error: any) {
      console.error('Complete lesson error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete lesson',
      });
    }
  }
}