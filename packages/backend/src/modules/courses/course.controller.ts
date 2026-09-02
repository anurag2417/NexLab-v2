import { Request, Response } from 'express';
import { z } from 'zod';
import { CourseService } from './course.service.js';

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
  // Create course
  static async create(req: Request, res: Response) {
    const data = createCourseSchema.parse(req.body);
    
    const course = await CourseService.createCourse({
      ...data,
      instructor: new (await import('mongoose')).Types.ObjectId(req.userId),
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully',
    });
  }

  // Get all courses
  static async getAll(req: Request, res: Response) {
    const { category, level, isPublished, search } = req.query;
    
    const courses = await CourseService.getCourses({
      category: category as string,
      level: level as string,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      data: courses,
      count: courses.length,
    });
  }

  // Get single course
  static async getOne(req: Request, res: Response) {
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
  }

  // Update course
  static async update(req: Request, res: Response) {
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
  }

  // Delete course
  static async delete(req: Request, res: Response) {
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
  }

  // Toggle publish
  static async togglePublish(req: Request, res: Response) {
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
  }

  // Get popular courses
  static async getPopular(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 5;
    const courses = await CourseService.getPopularCourses(limit);
    
    res.status(200).json({
      success: true,
      data: courses,
    });
  }
}