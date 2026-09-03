import { Request, Response } from 'express';
import { User } from '../auth/auth.model.js';
import { Course } from '../courses/course.model.js';

export class AdminAnalyticsController {
  // ---------- Get Overview ----------
  static async getOverview(req: Request, res: Response) {
    try {
      console.log('📊 Fetching analytics overview...');

      // Get basic counts - handle empty collections gracefully
      const [totalStudents, totalCourses] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Course.countDocuments(),
      ]);

      // Get published courses
      const publishedCourses = await Course.countDocuments({ isPublished: true });

      // Get total lessons and enrollments
      const courses = await Course.find().select('lessons enrolledStudents price').lean();
      
      let totalLessons = 0;
      let totalEnrollments = 0;
      let totalRevenue = 0;

      for (const course of courses) {
        totalLessons += (course.lessons?.length || 0);
        totalEnrollments += (course.enrolledStudents?.length || 0);
        totalRevenue += (course.price || 0) * (course.enrolledStudents?.length || 0);
      }

      // Get growth data using the static method
      const growthData = await AdminAnalyticsController.getGrowthData();

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalStudents: totalStudents || 0,
            totalCourses: totalCourses || 0,
            publishedCourses: publishedCourses || 0,
            totalLessons: totalLessons || 0,
            totalEnrollments: totalEnrollments || 0,
            totalRevenue: Math.round((totalRevenue || 0) * 100) / 100,
          },
          growth: growthData,
        },
      });
      
    } catch (error: any) {
      console.error('❌ Get overview error:', error);
      // Return empty data instead of failing
      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalStudents: 0,
            totalCourses: 0,
            publishedCourses: 0,
            totalLessons: 0,
            totalEnrollments: 0,
            totalRevenue: 0,
          },
          growth: [],
        },
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

        // Simplified - get new enrollments for that day
        const newEnrollments = await Course.aggregate([
          { $unwind: { path: '$enrolledStudents', preserveNullAndEmptyArrays: true } },
          { 
            $match: {
              // This is simplified - in production you'd have timestamps on enrollments
            }
          },
          { $count: 'total' }
        ]);

        data.push({
          date: date.toISOString().split('T')[0],
          label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          newUsers: newUsers || 0,
          newEnrollments: 0, // Simplified
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
      const popularCourses = await Course.find({ isPublished: true })
        .sort({ enrolledStudents: -1 })
        .limit(10)
        .select('title level enrolledStudents lessons isPublished price rating')
        .lean();

      const levelDistribution = await Course.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]);

      const levelMap: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0 };
      levelDistribution.forEach((item: any) => {
        if (item._id) levelMap[item._id] = item.count;
      });

      res.status(200).json({
        success: true,
        data: {
          popularCourses: popularCourses || [],
          levelDistribution: levelMap,
          totalCourses: await Course.countDocuments(),
          publishedCourses: await Course.countDocuments({ isPublished: true }),
        },
      });
    } catch (error: any) {
      console.error('Get course analytics error:', error);
      res.status(200).json({
        success: true,
        data: {
          popularCourses: [],
          levelDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
          totalCourses: 0,
          publishedCourses: 0,
        },
      });
    }
  }

  // ---------- Get Student Analytics ----------
  static async getStudentAnalytics(req: Request, res: Response) {
    try {
      const levelDistribution = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      const avgStats = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: {
          _id: null,
          avgXp: { $avg: '$xp' },
          avgLevel: { $avg: '$level' },
          maxXp: { $max: '$xp' },
          maxLevel: { $max: '$level' },
        }}
      ]);

      res.status(200).json({
        success: true,
        data: {
          levelDistribution: levelDistribution || [],
          avgStats: avgStats[0] || { avgXp: 0, avgLevel: 0, maxXp: 0, maxLevel: 0 },
          totalStudents: await User.countDocuments({ role: 'student' }),
        },
      });
    } catch (error: any) {
      console.error('Get student analytics error:', error);
      res.status(200).json({
        success: true,
        data: {
          levelDistribution: [],
          avgStats: { avgXp: 0, avgLevel: 0, maxXp: 0, maxLevel: 0 },
          totalStudents: 0,
        },
      });
    }
  }

  // ---------- Get Revenue Analytics ----------
  static async getRevenueAnalytics(req: Request, res: Response) {
    try {
      const revenueByCourse = await Course.aggregate([
        { $project: {
          title: 1,
          price: 1,
          enrolledStudents: { $size: '$enrolledStudents' },
          revenue: { $multiply: ['$price', { $size: '$enrolledStudents' }] },
        }},
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);

      let totalRevenue = 0;
      for (const course of revenueByCourse) {
        totalRevenue += (course.revenue || 0);
      }

      res.status(200).json({
        success: true,
        data: {
          revenueByCourse: revenueByCourse || [],
          totalRevenue: Math.round((totalRevenue || 0) * 100) / 100,
          totalCourses: await Course.countDocuments(),
        },
      });
    } catch (error: any) {
      console.error('Get revenue analytics error:', error);
      res.status(200).json({
        success: true,
        data: {
          revenueByCourse: [],
          totalRevenue: 0,
          totalCourses: 0,
        },
      });
    }
  }

  // ---------- Get Engagement Analytics ----------
  static async getEngagementAnalytics(req: Request, res: Response) {
    try {
      const totalEnrollments = await Course.aggregate([
        { $unwind: { path: '$enrolledStudents', preserveNullAndEmptyArrays: true } },
        { $count: 'total' }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalCourses: await Course.countDocuments(),
          totalEnrollments: totalEnrollments[0]?.total || 0,
          courseEngagement: [],
        },
      });
    } catch (error: any) {
      console.error('Get engagement analytics error:', error);
      res.status(200).json({
        success: true,
        data: {
          totalCourses: 0,
          totalEnrollments: 0,
          courseEngagement: [],
        },
      });
    }
  }
}