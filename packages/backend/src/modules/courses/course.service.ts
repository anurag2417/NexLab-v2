import { Types } from 'mongoose';
import { Course, ICourse } from './course.model.js';
import { redisClient } from '../../config/redis.js';

export class CourseService {
  private static CACHE_KEY = 'courses:list';

  // Create a new course
  static async createCourse(data: Partial<ICourse>): Promise<ICourse> {
    const course = await Course.create(data);
    await this.clearCache();
    return course;
  }

  // Get all courses (with optional filters)
  static async getCourses(filters: {
    category?: string;
    level?: string;
    isPublished?: boolean;
    search?: string;
  }): Promise<ICourse[]> {
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;
    if (filters.isPublished !== undefined) query.isPublished = filters.isPublished;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return await Course.find(query)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
  }

  // Get single course by ID or slug
  static async getCourseById(id: string): Promise<ICourse | null> {
    return await Course.findById(id)
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email');
  }

  static async getCourseBySlug(slug: string): Promise<ICourse | null> {
    return await Course.findOne({ slug })
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email');
  }

  // Update course
  static async updateCourse(id: string, data: Partial<ICourse>): Promise<ICourse | null> {
    const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (course) await this.clearCache();
    return course;
  }

  // Delete course
  static async deleteCourse(id: string): Promise<boolean> {
    const result = await Course.findByIdAndDelete(id);
    if (result) await this.clearCache();
    return !!result;
  }

  // Toggle publish status
  static async togglePublish(id: string): Promise<ICourse | null> {
    const course = await Course.findById(id);
    if (!course) return null;
    
    course.isPublished = !course.isPublished;
    await course.save();
    await this.clearCache();
    return course;
  }

  // Enroll a student
  static async enrollStudent(courseId: string, userId: string): Promise<boolean> {
    const course = await Course.findById(courseId);
    if (!course) return false;
    
    const userIdObj = new Types.ObjectId(userId);
    if (course.enrolledStudents.includes(userIdObj)) {
      return false; // Already enrolled
    }
    
    course.enrolledStudents.push(userIdObj);
    await course.save();
    return true;
  }

  // Get popular courses (by enrollment count)
  static async getPopularCourses(limit: number = 5): Promise<ICourse[]> {
    return await Course.find({ isPublished: true })
      .sort({ enrolledStudents: -1 })
      .limit(limit)
      .populate('instructor', 'name');
  }

  // Clear cache
  private static async clearCache() {
    try {
      await redisClient.del(this.CACHE_KEY);
    } catch (error) {
      // Redis may not be available - ignore
    }
  }
}