import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Play, Search, Eye, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { CoursePreviewModal } from '../../components/CoursePreviewModal';

interface Course {
  _id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: any[];
  enrolledStudents: string[];
  isPublished: boolean;
  price: number;
  instructor?: { name: string; email: string };
  category: string;
  createdAt: string;
  rating?: number;
  totalReviews?: number;
}

export const StudentCourses: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses/published');
      console.log('📚 Published courses:', response.data);
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      await checkAuth();
      await fetchCourses();
      setIsModalOpen(false);
      alert('Successfully enrolled in course! 🎉');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const handleLearnMore = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const isUserEnrolled = (course: Course): boolean => {
    const userId = user?._id || user?.id;
    return (userId ? course.enrolledStudents?.includes(userId) : false) || 
           user?.enrolledCourses?.includes(course._id) || false;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
      intermediate: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
      advanced: 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20',
    };
    return colors[level] || 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFEE]">Available Courses</h1>
          <p className="text-[#9CA3A0] mt-1">Expand your skills with our curated content</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchCourses}
          className="gap-1"
        >
          🔄 Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-[#10B981] mx-auto mb-4 opacity-40" />
          <p className="text-[#9CA3A0]">No courses available yet. Check back soon!</p>
          <p className="text-[#5C6360] text-sm mt-2">Make sure courses are published in the admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = isUserEnrolled(course);
            const lessonCount = course.lessons?.length || 0;
            const studentCount = course.enrolledStudents?.length || 0;

            return (
              <div
                key={course._id}
                className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm hover:shadow-[#10B981]/5 hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/10 flex items-center justify-center relative">
                  <BookOpen className="w-12 h-12 text-[#10B981] opacity-40" />
                  {course.rating && course.rating > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0D0F0F]/80 px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                      <span className="text-xs font-medium text-[#EDEFEE]">{course.rating.toFixed(1)}</span>
                      <span className="text-xs text-[#5C6360]">({course.totalReviews || 0})</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="text-xs text-[#9CA3A0]">• {lessonCount} lessons</span>
                  </div>

                  <h3 className="text-lg font-semibold text-[#EDEFEE]">{course.title}</h3>
                  <p className="text-sm text-[#9CA3A0] mt-1 line-clamp-2">{course.description}</p>

                  {course.rating && course.rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                      <span className="text-sm font-medium text-[#EDEFEE]">{course.rating.toFixed(1)}</span>
                      <span className="text-xs text-[#5C6360]">({course.totalReviews || 0})</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A302E]">
                    <div className="flex items-center gap-3 text-xs text-[#9CA3A0]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {studentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {lessonCount} lessons
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLearnMore(course)}
                            className="gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Learn More
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleEnroll(course._id)}
                            disabled={enrolling === course._id}
                          >
                            {enrolling === course._id ? 'Enrolling...' : `Enroll ${course.price > 0 ? `$${course.price}` : 'Free'}`}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Preview Modal */}
      {selectedCourse && (
        <CoursePreviewModal
          course={selectedCourse}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCourse(null);
          }}
          onEnroll={() => handleEnroll(selectedCourse._id)}
          isEnrolled={isUserEnrolled(selectedCourse)}
        />
      )}
    </div>
  );
};