import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../auth/auth.model.js';
import { Course } from '../courses/course.model.js';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export class UserController {
  // ---------- Get User Profile ----------
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.userId;
      
      const user = await User.findById(userId)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Get enrolled courses with progress
      const enrolledCourses = await Course.find({
        _id: { $in: user.enrolledCourses || [] }
      }).select('title description level lessons enrolledStudents');

      // Calculate total lessons completed
      let totalCompletedLessons = 0;
      let totalLessons = 0;
      const courseProgress = [];

      for (const course of enrolledCourses) {
        const progressKey = `progress:${course._id}`;
        const completedLessons = user.progress?.[progressKey] || [];
        const courseTotalLessons = course.lessons?.length || 0;
        
        totalCompletedLessons += completedLessons.length;
        totalLessons += courseTotalLessons;
        
        courseProgress.push({
          courseId: course._id,
          title: course.title,
          completedLessons: completedLessons.length,
          totalLessons: courseTotalLessons,
          percentage: courseTotalLessons > 0 
            ? Math.round((completedLessons.length / courseTotalLessons) * 100) 
            : 0,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            xp: user.xp || 0,
            level: user.level || 1,
            streak: user.streak || 0,
            badges: user.badges || [],
            enrolledCourses: user.enrolledCourses || [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          stats: {
            totalCourses: enrolledCourses.length,
            totalCompletedLessons,
            totalLessons,
            overallProgress: totalLessons > 0 
              ? Math.round((totalCompletedLessons / totalLessons) * 100) 
              : 0,
          },
          courseProgress,
        },
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
      });
    }
  }

  // ---------- Update Profile ----------
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { name, email, currentPassword, newPassword } = updateProfileSchema.parse(req.body);

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update name
      if (name) {
        user.name = name;
      }

      // Update email (check if already taken)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use',
          });
        }
        user.email = email;
      }

      // Update password
      if (currentPassword && newPassword) {
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect',
          });
        }
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            badges: user.badges,
          },
        },
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  // ---------- Get User Stats ----------
  static async getStats(req: Request, res: Response) {
    try {
      const userId = req.userId;
      
      const user = await User.findById(userId)
        .select('xp level streak badges enrolledCourses progress')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Calculate stats
      let totalCompletedLessons = 0;
      let totalLessons = 0;
      
      if (user.progress) {
        for (const [, lessons] of Object.entries(user.progress)) {
          totalCompletedLessons += lessons.length;
        }
      }

      // Get enrolled courses
      const enrolledCourses = await Course.find({
        _id: { $in: user.enrolledCourses || [] }
      }).select('lessons');

      for (const course of enrolledCourses) {
        totalLessons += course.lessons?.length || 0;
      }

      const nextLevelXp = (user.level || 1) * 100;
      const currentXp = user.xp || 0;

      res.status(200).json({
        success: true,
        data: {
          xp: currentXp,
          level: user.level || 1,
          streak: user.streak || 0,
          badges: user.badges || [],
          enrolledCourses: user.enrolledCourses?.length || 0,
          completedLessons: totalCompletedLessons,
          totalLessons: totalLessons,
          overallProgress: totalLessons > 0 
            ? Math.round((totalCompletedLessons / totalLessons) * 100) 
            : 0,
          xpToNextLevel: nextLevelXp - currentXp,
          xpProgress: Math.min(Math.round((currentXp / nextLevelXp) * 100), 100),
        },
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch stats',
      });
    }
  }

  // ---------- Get Activity History ----------
  static async getActivity(req: Request, res: Response) {
    try {
      const userId = req.userId;
      
      const user = await User.findById(userId)
        .select('progress enrolledCourses')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Get course details
      const courses = await Course.find({
        _id: { $in: user.enrolledCourses || [] }
      }).select('title lessons');

      // Build activity list
      const activities = [];
      
      if (user.progress) {
        for (const [key, completedLessonIds] of Object.entries(user.progress)) {
          const courseId = key.replace('progress:', '');
          const course = courses.find(c => c._id.toString() === courseId);
          
          if (course) {
            for (const lessonId of completedLessonIds) {
              const lesson = course.lessons?.find(l => l._id?.toString() === lessonId);
              if (lesson) {
                activities.push({
                  courseId: course._id,
                  courseTitle: course.title,
                  lessonId: lesson._id,
                  lessonTitle: lesson.title,
                  completedAt: new Date().toISOString(), // In production, store this
                });
              }
            }
          }
        }
      }

      // Sort by most recent (if we had timestamps)
      activities.reverse();

      res.status(200).json({
        success: true,
        data: activities.slice(0, 20), // Limit to 20 most recent
        total: activities.length,
      });
    } catch (error: any) {
      console.error('Get activity error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch activity',
      });
    }
  }
}