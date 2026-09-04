import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { ActivityHeatmap } from '../../components/ActivityHeatmap';
import { 
  Flame, Zap, Award, BookOpen, TrendingUp, CheckCircle, ArrowRight,
  Code2, Trophy, Target, Calendar, Clock
} from 'lucide-react';

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

interface ProblemStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export const StudentDashboard: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(true);
  const [problemStats, setProblemStats] = useState<ProblemStats>({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  });
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchProblemStats();
    fetchHeatmapData();
    fetchRecentSubmissions();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userId = user?._id || user?.id;
      
      let allCourses = [];
      try {
        const response = await api.get('/courses/published');
        allCourses = response.data.data || [];
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
      
      const enrolled = allCourses.filter((c: any) => 
        c.enrolledStudents?.includes(userId) || user?.enrolledCourses?.includes(c._id)
      );
      setEnrolledCourses(enrolled);

      const progressData: Record<string, CourseProgress> = {};
      for (const course of enrolled) {
        try {
          const progressRes = await api.get(`/courses/${course._id}/progress`);
          progressData[course._id] = progressRes.data.data;
        } catch (e) {
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

  const fetchProblemStats = async () => {
    try {
      const response = await api.get('/problems/submissions');
      const submissions = response.data.data || [];
      
      const solvedIds = submissions
        .filter((s: any) => s.status === 'accepted')
        .map((s: any) => s.problemId?._id || s.problemId);
      
      // Get unique solved problem IDs
      const uniqueSolved = [...new Set(solvedIds)];
      
      // Fetch problem details to get difficulty
      const problemsRes = await api.get('/problems');
      const allProblems = problemsRes.data.data || [];
      
      let easy = 0, medium = 0, hard = 0;
      for (const problem of allProblems) {
        if (uniqueSolved.includes(problem._id)) {
          if (problem.difficulty === 'easy') easy++;
          else if (problem.difficulty === 'medium') medium++;
          else if (problem.difficulty === 'hard') hard++;
        }
      }
      
      setProblemStats({
        totalSolved: uniqueSolved.length,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
      });
    } catch (error) {
      console.error('Error fetching problem stats:', error);
    }
  };

  const fetchHeatmapData = async () => {
    try {
      const response = await api.get('/problems/submissions');
      const submissions = response.data.data || [];
      
      // Group submissions by date
      const dateMap: Record<string, number> = {};
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      // Initialize all dates in the last year with 0
      for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = 0;
      }
      
      // Count submissions per day
      for (const sub of submissions) {
        if (sub.status === 'accepted') {
          const date = new Date(sub.createdAt || sub.submittedAt);
          const dateStr = date.toISOString().split('T')[0];
          if (dateMap[dateStr] !== undefined) {
            dateMap[dateStr]++;
          }
        }
      }
      
      const heatmapData = Object.entries(dateMap).map(([date, count]) => ({
        date,
        count,
      }));
      
      setHeatmapData(heatmapData);
      
      // Calculate streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (dateMap[dateStr] && dateMap[dateStr] > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      
      setDailyStreak(streak);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const response = await api.get('/problems/submissions');
      const submissions = (response.data.data || []).slice(0, 5);
      setRecentSubmissions(submissions);
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
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

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return 'text-[#10B981]';
    if (difficulty === 'medium') return 'text-[#FBBF24]';
    return 'text-[#F87171]';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') return '✅';
    if (status === 'wrong_answer') return '❌';
    if (status === 'time_limit') return '⏱️';
    return '💥';
  };

  const nextLevelXp = (user?.level || 1) * 100;
  const currentXp = user?.xp || 0;
  const xpProgress = Math.min((currentXp / nextLevelXp) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0D0F0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto">
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
              {dailyStreak || user.streak || 0} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          title="Problems Solved" 
          value={problemStats.totalSolved || 0} 
          icon={<Code2 className="w-6 h-6 text-[#FBBF24]" />} 
          color="warning"
        />
        <StatCard 
          title="Courses Enrolled" 
          value={enrolledCourses.length} 
          icon={<BookOpen className="w-6 h-6 text-[#F87171]" />} 
          color="error"
        />
      </div>

      {/* ✅ Problem Solving Progress */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-[#FBBF24]" />
          <h3 className="text-sm font-medium text-[#EDEFEE]">Problem Solving Progress</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-[#0D0F0F] rounded-lg">
            <div className="text-2xl font-bold text-[#10B981]">{problemStats.easySolved || 0}</div>
            <div className="text-xs text-[#5C6360]">🟢 Easy</div>
          </div>
          <div className="text-center p-3 bg-[#0D0F0F] rounded-lg">
            <div className="text-2xl font-bold text-[#FBBF24]">{problemStats.mediumSolved || 0}</div>
            <div className="text-xs text-[#5C6360]">🟡 Medium</div>
          </div>
          <div className="text-center p-3 bg-[#0D0F0F] rounded-lg">
            <div className="text-2xl font-bold text-[#F87171]">{problemStats.hardSolved || 0}</div>
            <div className="text-xs text-[#5C6360]">🔴 Hard</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#5C6360] mb-1">
            <span>Total Solved</span>
            <span className="text-[#EDEFEE]">{problemStats.totalSolved || 0} problems</span>
          </div>
          <div className="w-full h-2 bg-[#0D0F0F] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#10B981] via-[#FBBF24] to-[#F87171] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((problemStats.totalSolved || 0) / 50 * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ✅ Activity Heatmap */}
      <div className="mb-8">
        <ActivityHeatmap data={heatmapData} />
      </div>

      {/* XP Progress Bar */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-5 mb-8 shadow-sm">
        <div className="flex justify-between text-sm text-[#9CA3A0] mb-1.5">
          <span>Progress to Level {user?.level ? user.level + 1 : 2}</span>
          <span className="text-[#10B981] font-medium">{currentXp} / {nextLevelXp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-[#0D0F0F] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* ✅ Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#60A5FA]" />
            <h2 className="text-lg font-semibold text-[#EDEFEE]">Recent Activity</h2>
          </div>
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl divide-y divide-[#2A302E] shadow-sm">
            {recentSubmissions.map((sub, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getStatusIcon(sub.status)}</span>
                  <div>
                    <p className="text-sm text-[#EDEFEE]">
                      {sub.problemId?.title || 'Problem'} 
                      <span className={`ml-2 text-xs font-medium ${
                        sub.status === 'accepted' ? 'text-[#10B981]' : 'text-[#F87171]'
                      }`}>
                        {sub.status === 'accepted' ? '✅ Solved' : sub.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#5C6360]">
                      <span>Runtime: {sub.runtime || 0}ms</span>
                      <span>Memory: {sub.memory || 0}MB</span>
                      <span>{new Date(sub.createdAt || sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#5C6360]">
                  {new Date(sub.createdAt || sub.submittedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/problems')}
          className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4 text-center hover:border-[#10B981] transition-colors"
        >
          <Code2 className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
          <span className="text-sm text-[#EDEFEE]">Practice Problems</span>
        </button>
        <button
          onClick={() => navigate('/courses')}
          className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4 text-center hover:border-[#10B981] transition-colors"
        >
          <BookOpen className="w-6 h-6 text-[#60A5FA] mx-auto mb-2" />
          <span className="text-sm text-[#EDEFEE]">Browse Courses</span>
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4 text-center hover:border-[#10B981] transition-colors"
        >
          <Trophy className="w-6 h-6 text-[#FBBF24] mx-auto mb-2" />
          <span className="text-sm text-[#EDEFEE]">Leaderboard</span>
        </button>
        <button
          onClick={() => navigate('/sandbox')}
          className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4 text-center hover:border-[#10B981] transition-colors"
        >
          <Zap className="w-6 h-6 text-[#F87171] mx-auto mb-2" />
          <span className="text-sm text-[#EDEFEE]">Code Sandbox</span>
        </button>
      </div>
    </div>
  );
};