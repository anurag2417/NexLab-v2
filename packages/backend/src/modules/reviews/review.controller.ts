import { Request, Response } from 'express';
import { z } from 'zod';
import { ReviewService } from './review.service.js';
import { Course } from '../courses/course.model.js';

// Validation schemas
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(3).max(1000).optional(),
});

export class ReviewController {
  // ---------- Create Review ----------
  static async create(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.userId;
      const { rating, comment } = createReviewSchema.parse(req.body);

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      // Check if user is enrolled
      const isEnrolled = course.enrolledStudents.some(
        (id) => id.toString() === userId
      );
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to review it',
        });
      }

      const review = await ReviewService.createReview(
        courseId,
        userId,
        rating,
        comment
      );

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review,
      });
    } catch (error: any) {
      console.error('Create review error:', error);
      
      if (error.message === 'You have already reviewed this course') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create review',
      });
    }
  }

  // ---------- Update Review ----------
  static async update(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const userId = req.userId;
      const { rating, comment } = updateReviewSchema.parse(req.body);

      const review = await ReviewService.updateReview(
        reviewId,
        userId,
        rating as number,
        comment as string
      );

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: review,
      });
    } catch (error: any) {
      console.error('Update review error:', error);
      
      if (error.message === 'Review not found or you are not authorized') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update review',
      });
    }
  }

  // ---------- Delete Review ----------
  static async delete(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const userId = req.userId;

      await ReviewService.deleteReview(reviewId, userId);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete review error:', error);
      
      if (error.message === 'Review not found or you are not authorized') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete review',
      });
    }
  }

  // ---------- Get Course Reviews ----------
  static async getCourseReviews(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const data = await ReviewService.getCourseReviews(courseId, page, limit);

      // Get user's review if authenticated
      let userReview = null;
      if (req.userId) {
        userReview = await ReviewService.getUserReview(courseId, req.userId);
      }

      // Get rating distribution
      const distribution = await ReviewService.getRatingDistribution(courseId);

      res.status(200).json({
        success: true,
        data: {
          ...data,
          userReview,
          distribution,
        },
      });
    } catch (error: any) {
      console.error('Get course reviews error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch reviews',
      });
    }
  }

  // ---------- Get User's Review for Course ----------
  static async getUserReview(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.userId;

      const review = await ReviewService.getUserReview(courseId, userId);

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error('Get user review error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user review',
      });
    }
  }
}