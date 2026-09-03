import { Request, Response } from 'express';
import { User } from '../auth/auth.model.js';
import { Course } from '../courses/course.model.js';

export class AdminAnalyticsController {
  // ---------- Get Overview ----------
  static async getOverview(req: Request, res: Response) {
    try {
      // Get basic counts
      const [totalStudents, totalCourses] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Course.countDocuments(),
      ]);

      // Get published courses
      const publishedCourses = await Course.countDocuments({ isPublished: true });

      // Get total lessons
      const courses = await Course.find().select('lessons');
      let totalLessons = 0;
      for (const course of courses) {
        totalLessons += course.lessons?.length || 0;
      }

      // Get total enrollments
      let totalEnrollments = 0;
      for (const course of courses) {
        totalEnrollments += course.enrolledStudents?.length || 0;
      }

      // Get total revenue
      let totalRevenue = 0;
      for (const course of courses) {
        totalRevenue += (course.price || 0) * (course.enrolledStudents?.length || 0);
      }

      // Get growth data (last 7 days)
      const growthData = await this.getGrowthData();

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalStudents,
            totalCourses,
            publishedCourses,
            totalLessons,
            totalEnrollments,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
          },
          growth: growthData,
        },
      });
    } catch (error: any) {
      console.error('Get overview error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch overview data',
      });
    }
  }

  // ---------- Get Growth Data ----------
  static async getGrowthData() {
    try {
      const data = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const newUsers = await User.countDocuments({
          role: 'student',
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const newEnrollments = await Course.aggregate([
          { $unwind: { path: '$enrolledStudents', preserveNullAndEmptyArrays: true } },
          { 
            $match: {
              enrolledStudents: { 
                $in: await User.find({
                  role: 'student',
                  createdAt: { $gte: startOfDay, $lte: endOfDay }
                }).distinct('_id')
              }
            }
          },
          { $count: 'total' }
        ]);

        data.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          newUsers,
          newEnrollments: newEnrollments[0]?.total || 0,
        });
      }

      return data;
    } catch (error) {
      console.error('Error getting growth data:', error);
      return [];
    }
  }

  // ---------- Get Course Analytics ----------
  static async getCourseAnalytics(req: Request, res: Response) {
    try {
      // Get most popular courses
      const popularCourses = await Course.aggregate([
        {
          $project: {
            title: 1,
            level: 1,
            enrolledStudents: { $size: '$enrolledStudents' },
            lessons: { $size: '$lessons' },
            isPublished: 1,
            price: 1,
            rating: 1,
          }
        },
        { $sort: { enrolledStudents: -1 } },
        { $limit: 10 }
      ]);

      // Get distribution by level
      const levelDistribution = await Course.aggregate([
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
          }
        }
      ]);

      const levelMap: Record<string, number> = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      };
      levelDistribution.forEach((item: any) => {
        levelMap[item._id] = item.count;
      });

      res.status(200).json({
        success: true,
        data: {
          popularCourses,
          levelDistribution: levelMap,
          totalCourses: await Course.countDocuments(),
          publishedCourses: await Course.countDocuments({ isPublished: true }),
        },
      });
    } catch (error: any) {
      console.error('Get course analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch course analytics',
      });
    }
  }

  // ---------- Get Student Analytics ----------
  static async getStudentAnalytics(req: Request, res: Response) {
    try {
      // Get student distribution by level
      const levelDistribution = await User.aggregate([
        { $match: { role: 'student' } },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get average XP and level
      const avgStats = await User.aggregate([
        { $match: { role: 'student' } },
        {
          $group: {
            _id: null,
            avgXp: { $avg: '$xp' },
            avgLevel: { $avg: '$level' },
            maxXp: { $max: '$xp' },
            maxLevel: { $max: '$level' },
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          levelDistribution,
          avgStats: avgStats[0] || { avgXp: 0, avgLevel: 0, maxXp: 0, maxLevel: 0 },
          totalStudents: await User.countDocuments({ role: 'student' }),
        },
      });
    } catch (error: any) {
      console.error('Get student analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch student analytics',
      });
    }
  }

  // ---------- Get Revenue Analytics ----------
  static async getRevenueAnalytics(req: Request, res: Response) {
    try {
      // Get revenue by course
      const revenueByCourse = await Course.aggregate([
        {
          $project: {
            title: 1,
            price: 1,
            enrolledStudents: { $size: '$enrolledStudents' },
            revenue: { $multiply: ['$price', { $size: '$enrolledStudents' }] },
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);

      // Calculate total revenue
      let totalRevenue = 0;
      for (const course of revenueByCourse) {
        totalRevenue += course.revenue || 0;
      }

      res.status(200).json({
        success: true,
        data: {
          revenueByCourse,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalCourses: await Course.countDocuments(),
        },
      });
    } catch (error: any) {
      console.error('Get revenue analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch revenue analytics',
      });
    }
  }

  // ---------- Get Engagement Analytics ----------
  static async getEngagementAnalytics(req: Request, res: Response) {
    try {
      // Get course completion rates
      const completionRates = await Course.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'enrolledStudents',
            foreignField: '_id',
            as: 'students'
          }
        },
        {
          $project: {
            title: 1,
            enrolledCount: { $size: '$enrolledStudents' },
            lessonsCount: { $size: '$lessons' },
          }
        }
      ]);

      const totalEnrollments = await Course.aggregate([
        { $unwind: { path: '$enrolledStudents', preserveNullAndEmptyArrays: true } },
        { $count: 'total' }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalCourses: await Course.countDocuments(),
          totalEnrollments: totalEnrollments[0]?.total || 0,
          courseEngagement: completionRates.slice(0, 10),
        },
      });
    } catch (error: any) {
      console.error('Get engagement analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch engagement analytics',
      });
    }
  }
}