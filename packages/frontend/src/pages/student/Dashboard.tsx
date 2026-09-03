import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Flame, Zap, Award, BookOpen, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface EnrolledCourse {
  _id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: any[];
  enrolledStudents: string[];
}

interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
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
      const userId = user?._id || user?.id;
      
      // Fetch published courses only
      const response = await api.get('/courses/published');
      const allCourses = response.data.data || [];
      
      //console.log('📚 All published courses:', allCourses);
      //console.log('👤 User ID:', userId);
      //console.log('📋 User enrolledCourses:', user?.enrolledCourses);

      // Filter courses the user is enrolled in
      const enrolled = allCourses.filter((c: any) => {
        const isInEnrolledStudents = c.enrolledStudents?.includes(userId);
        const isInUserEnrolled = user?.enrolledCourses?.includes(c._id);
        const isEnrolled = isInEnrolledStudents || isInUserEnrolled;
        
        //console.log(`📚 Course: ${c.title}`, {
        //  isInEnrolledStudents,
        //  isInUserEnrolled,
        //  isEnrolled,
        //});
        
        return isEnrolled;
      });
      
      //console.log('✅ Enrolled courses:', enrolled);
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
      beginner: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
      intermediate: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
      advanced: 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20',
    };
    return colors[level] || 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
  };

  const nextLevelXp = (user?.level || 1) * 100;
  const currentXp = user?.xp || 0;
  const xpProgress = Math.min((currentXp / nextLevelXp) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2A302E]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#EDEFEE]">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-[#9CA3A0] mt-1">
            {enrolledCourses.length === 0 
              ? "You haven't enrolled in any courses yet. Start learning today!" 
              : `You're making great progress! Keep up the momentum.`}
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-3 bg-[#161A19] border border-[#10B981]/20 rounded-lg px-4 py-2.5">
            <Flame className="w-5 h-5 text-[#10B981]" />
            <span className="text-sm font-semibold text-[#EDEFEE]">
              {user.streak || 0} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total XP" 
          value={user?.xp || 0} 
          icon={<Zap className="w-6 h-6 text-[#10B981]" />} 
          color="emerald"
        />
        <StatCard 
          title="Level" 
          value={user?.level || 1} 
          icon={<Award className="w-6 h-6 text-[#60A5FA]" />} 
          color="info"
        />
        <StatCard 
          title="Enrolled" 
          value={enrolledCourses.length} 
          icon={<BookOpen className="w-6 h-6 text-[#FBBF24]" />} 
          color="warning"
        />
        <StatCard 
          title="Badges" 
          value={user?.badges?.length || 0} 
          icon={<TrendingUp className="w-6 h-6 text-[#F87171]" />} 
          color="error"
        />
      </div>

      {/* XP Progress Bar */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-5 mb-8 shadow-sm">
        <div className="flex justify-between text-sm text-[#9CA3A0] mb-1.5">
          <span>Progress to Level {user?.level ? user.level + 1 : 2}</span>
          <span className="text-[#10B981] font-medium">{currentXp} / {nextLevelXp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-[#0D0F0F] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* My Courses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#EDEFEE]">My Learning Paths</h2>
          {enrolledCourses.length > 0 && (
            <button 
              onClick={() => navigate('/courses')}
              className="text-sm text-[#10B981] hover:text-[#34D399] cursor-pointer transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#10B981] mx-auto mb-4 opacity-40" />
            <p className="text-[#9CA3A0]">You haven't enrolled in any courses yet.</p>
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
                  className="bg-[#161A19] border border-[#2A302E] rounded-xl p-5 shadow-sm hover:shadow-[#10B981]/5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        {percentage === 100 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-medium border border-[#10B981]/20">
                            Completed 🎉
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-[#EDEFEE] truncate">{course.title}</h3>
                      <p className="text-sm text-[#9CA3A0] truncate">{course.description}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-[#9CA3A0] mb-1">
                      <span>{completed} of {total} lessons</span>
                      <span className="text-[#10B981] font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0D0F0F] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#10B981] rounded-full transition-all duration-500"
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