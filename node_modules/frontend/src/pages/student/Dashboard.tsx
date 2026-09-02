import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Flame, Zap, Award, BookOpen, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface EnrolledCourse {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: any[];
  enrolledStudents: string[];
  isPublished: boolean;
  instructor?: { name: string };
}

interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

export const StudentDashboard: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Wait for user data to be loaded
      if (!user?._id && !user?.id) {
        console.log('⏳ Waiting for user data...');
        await checkAuth();
      }

      const userId = user?._id || user?.id;
      console.log('🔍 User ID for dashboard:', userId);

      // Fetch all courses
      const response = await api.get('/courses?isPublished=true');
      const allCourses = response.data.data || [];
      
      console.log('🔍 All courses:', allCourses);
      console.log('🔍 User enrolledCourses:', user?.enrolledCourses);

      // Filter courses the user is enrolled in
      const enrolled = allCourses.filter((c: any) => {
        const isInEnrolledStudents = c.enrolledStudents?.includes(userId);
        const isInUserEnrolled = user?.enrolledCourses?.includes(c._id);
        const isEnrolled = isInEnrolledStudents || isInUserEnrolled;
        
        console.log(`📚 Course: ${c.title}`, {
          userId,
          isInEnrolledStudents,
          isInUserEnrolled,
          isEnrolled,
          enrolledStudents: c.enrolledStudents,
          userEnrolledCourses: user?.enrolledCourses
        });
        
        return isEnrolled;
      });
      
      console.log('✅ Enrolled courses:', enrolled);
      setEnrolledCourses(enrolled);

      // Fetch progress for each enrolled course
      const progressData: Record<string, CourseProgress> = {};
      for (const course of enrolled) {
        try {
          const progressRes = await api.get(`/courses/${course._id}/progress`);
          progressData[course._id] = progressRes.data.data;
        } catch (e) {
          console.error(`Error fetching progress for ${course._id}:`, e);
          progressData[course._id] = {
            completedLessons: 0,
            totalLessons: course.lessons?.length || 0,
            percentage: 0,
            completedLessonIds: [],
          };
        }
      }
      setProgressMap(progressData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-success-100 text-success-700',
      intermediate: 'bg-secondary-100 text-secondary-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const nextLevelXp = (user?.level || 1) * 100;
  const currentXp = user?.xp || 0;
  const xpProgress = Math.min((currentXp / nextLevelXp) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-heading">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-text-body mt-1">
            {enrolledCourses.length === 0 
              ? "You haven't enrolled in any courses yet. Start learning today!" 
              : `You're making great progress! Keep up the momentum.`}
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-3 bg-secondary-50 border border-secondary-200 rounded-lg px-4 py-2">
            <Flame className="w-5 h-5 text-secondary-500" />
            <span className="text-sm font-semibold text-secondary-700">
              {user.streak || 0} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-background-light border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Total XP</p>
              <p className="text-2xl font-bold text-text-heading">{user?.xp || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-background-light border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Level</p>
              <p className="text-2xl font-bold text-text-heading">{user?.level || 1}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-50 text-secondary-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-background-light border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Enrolled</p>
              <p className="text-2xl font-bold text-text-heading">{enrolledCourses.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-success-50 text-success-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-background-light border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Badges</p>
              <p className="text-2xl font-bold text-text-heading">{user?.badges?.length || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="bg-background-light border border-border rounded-xl p-5 mb-8 shadow-sm">
        <div className="flex justify-between text-sm text-text-body mb-1">
          <span>Progress to Level {user?.level ? user.level + 1 : 2}</span>
          <span className="text-primary-600 font-medium">{currentXp} / {nextLevelXp} XP</span>
        </div>
        <div className="w-full h-3 bg-background-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* My Courses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-heading">My Learning Paths</h2>
          <button 
            onClick={() => {
              checkAuth();
              fetchDashboardData();
            }}
            className="text-sm text-primary-600 hover:underline cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-background-light border border-border rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-body">You haven't enrolled in any courses yet.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/courses')}
              className="mt-4"
            >
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map((course) => {
              const progress = progressMap[course._id];
              const percentage = progress?.percentage || 0;
              const completed = progress?.completedLessons || 0;
              const total = progress?.totalLessons || course.lessons?.length || 0;

              return (
                <div
                  key={course._id}
                  className="bg-background-light border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        {percentage === 100 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success-100 text-success-700 font-medium">
                            Completed 🎉
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-text-heading truncate">{course.title}</h3>
                      <p className="text-sm text-text-body truncate">{course.description}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{completed} of {total} lessons</span>
                      <span className="text-primary-600 font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-background-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={percentage === 100 ? 'outline' : 'primary'}
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="mt-3 w-full gap-1"
                  >
                    {percentage === 100 ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Review Course
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Continue Learning
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};