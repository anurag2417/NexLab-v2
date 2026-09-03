import { Request, Response } from 'express';
import { User } from '../auth/auth.model.js';
import { Course } from '../courses/course.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export class AdminController {
  // ---------- Get All Students ----------
  static async getStudents(req: Request, res: Response) {
    try {
      const { search, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = { role: 'student' };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Sort options
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Get students with pagination
      const [students, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(query),
      ]);

      // Get enrolled courses count for each student
      const studentIds = students.map(s => s._id);
      const enrolledCourses = await Course.find({
        enrolledStudents: { $in: studentIds }
      }).select('enrolledStudents');

      // Create a map of student ID -> enrolled courses count
      const enrollmentCount: Record<string, number> = {};
      for (const course of enrolledCourses) {
        for (const studentId of course.enrolledStudents) {
          const id = studentId.toString();
          enrollmentCount[id] = (enrollmentCount[id] || 0) + 1;
        }
      }

      // Add enrollment count and rank to each student
      const studentsWithData = await Promise.all(students.map(async (student) => {
        const rankData = await LeaderboardService.getUserRank(student._id.toString());
        return {
          ...student,
          enrolledCoursesCount: enrollmentCount[student._id.toString()] || 0,
          rank: rankData?.rank || null,
        };
      }));

      res.status(200).json({
        success: true,
        data: {
          students: studentsWithData,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch students',
      });
    }
  }

  // ---------- Get Student Details ----------
  static async getStudentDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await User.findById(id)
        .select('-password')
        .lean();

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      // Get enrolled courses with progress
      const enrolledCourses = await Course.find({
        _id: { $in: student.enrolledCourses || [] }
      }).select('title description level lessons');

      // Calculate progress
      let totalCompletedLessons = 0;
      let totalLessons = 0;
      const courseProgress = [];

      for (const course of enrolledCourses) {
        const progressKey = `progress:${course._id}`;
        const completedLessons = student.progress?.[progressKey] || [];
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

      // Get rank
      const rankData = await LeaderboardService.getUserRank(student._id.toString());

      res.status(200).json({
        success: true,
        data: {
          student: {
            ...student,
            rank: rankData?.rank || null,
          },
          stats: {
            enrolledCourses: enrolledCourses.length,
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
      console.error('Get student details error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch student details',
      });
    }
  }

  // ---------- Update Student ----------
  static async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, role, xp, level } = req.body;

      const student = await User.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      // Update fields
      if (name) student.name = name;
      if (email) student.email = email;
      if (role) student.role = role;
      if (xp !== undefined) {
        student.xp = xp;
        // Update leaderboard
        await LeaderboardService.updateUserScore(id, xp);
      }
      if (level) student.level = level;

      await student.save();

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: {
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            xp: student.xp,
            level: student.level,
          },
        },
      });
    } catch (error: any) {
      console.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update student',
      });
    }
  }

  // ---------- Delete Student ----------
  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await User.findByIdAndDelete(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete student error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete student',
      });
    }
  }

  // ---------- Get Student Stats (Admin Overview) ----------
  static async getStudentStats(req: Request, res: Response) {
    try {
      const [totalStudents, activeStudents, newStudents] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ 
          role: 'student',
          updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        User.countDocuments({ 
          role: 'student',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          activeStudents,
          newStudents,
        },
      });
    } catch (error: any) {
      console.error('Get student stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch student stats',
      });
    }
  }
}