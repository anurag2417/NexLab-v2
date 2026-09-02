import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Play } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: any[];
  enrolledStudents: string[];
  isPublished: boolean;
  price: number;
  instructor?: { name: string };
}

export const StudentCourses: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/courses?isPublished=true');
      console.log('📚 Courses response:', response.data);
      setCourses(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      setError(error.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      console.log(`📚 Enrolling in course ${courseId}`);
      const response = await api.post(`/courses/${courseId}/enroll`);
      console.log('✅ Enrollment response:', response.data);
      
      // Refresh user data to update enrolledCourses
      await checkAuth();
      
      // Refresh courses to update enrollment status
      await fetchCourses();
      
      alert('Successfully enrolled in course! 🎉');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Error enrolling:', error);
      alert(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const isUserEnrolled = (course: Course): boolean => {
    const userId = user?._id || user?.id;
    console.log('🔍 User ID being checked:', userId);
    
    const isInCourse = course.enrolledStudents?.some((id: string) => id === userId) || false;
    const isInUser = user?.enrolledCourses?.some((id: string) => id === course._id) || false;
    
    console.log(`🔍 Course: ${course.title}`, {
      userId,
      isInCourse,
      isInUser,
      userEnrolledCourses: user?.enrolledCourses,
      courseEnrolledStudents: course.enrolledStudents,
    });
    
    return isInCourse || isInUser;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-success-100 text-success-700',
      intermediate: 'bg-secondary-100 text-secondary-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button variant="primary" onClick={fetchCourses} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const publishedCourses = courses.filter(c => c.isPublished);

  if (publishedCourses.length === 0) {
    return (
      <div className="py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-heading">Available Courses</h1>
            <p className="text-text-body mt-1">Expand your skills with our curated content</p>
          </div>
        </div>
        <div className="bg-background-light border border-border rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-body">No courses available yet. Check back soon!</p>
          <p className="text-text-muted text-sm mt-2">If you're an admin, create and publish a course.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Available Courses</h1>
          <p className="text-text-body mt-1">Expand your skills with our curated content</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCourses}
          className="gap-1"
        >
          <span>🔄</span> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedCourses.map((course) => {
          const isEnrolled = isUserEnrolled(course);
          const lessonCount = course.lessons?.length || 0;
          const studentCount = course.enrolledStudents?.length || 0;

          return (
            <div
              key={course._id}
              className="bg-background-light border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-12 h-12 text-primary-300" />
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                  <span className="text-xs text-text-muted">• {lessonCount} lessons</span>
                </div>

                <h3 className="text-lg font-semibold text-text-heading">{course.title}</h3>
                <p className="text-sm text-text-body mt-1 line-clamp-2">{course.description}</p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {studentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lessonCount} lessons
                    </span>
                  </div>
                  {isEnrolled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/course/${course._id}`)}
                      className="gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Continue
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleEnroll(course._id)}
                      disabled={enrolling === course._id}
                    >
                      {enrolling === course._id ? 'Enrolling...' : `Enroll ${course.price > 0 ? `$${course.price}` : 'Free'}`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};