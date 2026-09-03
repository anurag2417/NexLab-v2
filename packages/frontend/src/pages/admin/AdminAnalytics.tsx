import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, BookOpen, DollarSign, 
  BarChart3, RefreshCw,
  GraduationCap
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';

interface OverviewData {
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalRevenue: number;
}

interface GrowthData {
  date: string;
  label: string;
  newUsers: number;
  newEnrollments: number;
}

interface PopularCourse {
  title: string;
  level: string;
  enrolledStudents: number;
  lessons: number;
  isPublished: boolean;
  price: number;
  rating: number;
}

export const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'revenue'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, coursesRes] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/courses'),
      ]);

      setOverview(overviewRes.data.data.overview);
      setGrowthData(overviewRes.data.data.growth || []);
      setPopularCourses(coursesRes.data.data.popularCourses || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-[#10B981] bg-[#10B981]/10',
      intermediate: 'text-[#60A5FA] bg-[#60A5FA]/10',
      advanced: 'text-[#FBBF24] bg-[#FBBF24]/10',
    };
    return colors[level] || 'text-[#9CA3A0] bg-[#2A302E]';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2A302E]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#EDEFEE] flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-[#10B981]" />
            Analytics
          </h1>
          <p className="text-[#9CA3A0] mt-1">Monitor platform performance and insights</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          className="gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#10B981] text-white'
              : 'bg-[#161A19] text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322]'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'courses'
              ? 'bg-[#10B981] text-white'
              : 'bg-[#161A19] text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322]'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Courses
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-[#10B981] text-white'
              : 'bg-[#161A19] text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322]'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Students
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'revenue'
              ? 'bg-[#10B981] text-white'
              : 'bg-[#161A19] text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322]'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Revenue
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Overview Stats */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Students" 
                value={overview?.totalStudents || 0} 
                icon={<Users className="w-6 h-6 text-[#10B981]" />} 
                color="emerald"
              />
              <StatCard 
                title="Total Courses" 
                value={overview?.totalCourses || 0} 
                icon={<BookOpen className="w-6 h-6 text-[#60A5FA]" />} 
                color="info"
              />
              <StatCard 
                title="Total Enrollments" 
                value={overview?.totalEnrollments || 0} 
                icon={<GraduationCap className="w-6 h-6 text-[#FBBF24]" />} 
                color="warning"
              />
              <StatCard 
                title="Revenue" 
                value={`$${overview?.totalRevenue || 0}`} 
                icon={<DollarSign className="w-6 h-6 text-[#10B981]" />} 
                color="emerald"
              />
            </div>

            {/* Growth Chart */}
            <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4">Growth (Last 7 Days)</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {growthData.map((day, index) => {
                  const maxValue = Math.max(...growthData.map(d => d.newUsers), 1);
                  const height = (day.newUsers / maxValue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center">
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-t transition-all duration-500"
                          style={{ height: `${Math.max(height * 0.8, 4)}px` }}
                        />
                        <div className="text-xs text-[#5C6360] mt-2">{day.label}</div>
                        <div className="text-xs font-medium text-[#EDEFEE]">{day.newUsers}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#5C6360] text-center mt-4">New users per day</p>
            </div>

            {/* Popular Courses Preview */}
            <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4">Popular Courses</h3>
              <div className="space-y-3">
                {popularCourses.slice(0, 5).map((course, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-[#2A302E] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#5C6360]">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-[#EDEFEE]">{course.title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          <span className="text-[#5C6360]">{course.enrolledStudents} students</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#10B981]">{course.enrolledStudents}</p>
                      <p className="text-xs text-[#5C6360">enrolled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4">All Courses Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#EDEFEE]">{overview?.totalCourses || 0}</p>
                <p className="text-xs text-[#5C6360]">Total Courses</p>
              </div>
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#10B981]">{overview?.publishedCourses || 0}</p>
                <p className="text-xs text-[#5C6360]">Published</p>
              </div>
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#FBBF24]">{overview?.totalLessons || 0}</p>
                <p className="text-xs text-[#5C6360]">Total Lessons</p>
              </div>
            </div>

            <h4 className="font-medium text-[#EDEFEE] mb-3">Top Courses by Enrollment</h4>
            <div className="space-y-3">
              {popularCourses.map((course, index) => (
                <div key={index} className="flex items-center justify-between border-b border-[#2A302E] pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#EDEFEE]">{course.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#5C6360]">
                      <span className={`px-1.5 py-0.5 rounded ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                      <span>{course.lessons} lessons</span>
                      <span>{course.enrolledStudents} students</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#10B981]">{course.enrolledStudents}</p>
                    <p className="text-xs text-[#5C6360]">enrollments</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4">Student Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#EDEFEE]">{overview?.totalStudents || 0}</p>
                <p className="text-xs text-[#5C6360]">Total Students</p>
              </div>
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#10B981]">Coming Soon</p>
                <p className="text-xs text-[#5C6360]">Active Students</p>
              </div>
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#FBBF24]">{overview?.totalEnrollments || 0}</p>
                <p className="text-xs text-[#5C6360]">Total Enrollments</p>
              </div>
            </div>

            <div className="text-center py-8">
              <Users className="w-12 h-12 text-[#5C6360] mx-auto mb-3 opacity-40" />
              <p className="text-[#9CA3A0]">Detailed student analytics coming soon</p>
              <p className="text-xs text-[#5C6360] mt-1">Check back for more insights</p>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4">Revenue Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#10B981]">${overview?.totalRevenue || 0}</p>
                <p className="text-xs text-[#5C6360]">Total Revenue</p>
              </div>
              <div className="bg-[#0D0F0F] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#EDEFEE]">{overview?.totalCourses || 0}</p>
                <p className="text-xs text-[#5C6360]">Total Courses</p>
              </div>
            </div>

            <h4 className="font-medium text-[#EDEFEE] mb-3">Revenue by Course</h4>
            <div className="space-y-3">
              {popularCourses.slice(0, 5).map((course, index) => (
                <div key={index} className="flex items-center justify-between border-b border-[#2A302E] pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#EDEFEE]">{course.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#5C6360]">
                      <span>${course.price}</span>
                      <span>{course.enrolledStudents} students</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#10B981]">${(course.price * course.enrolledStudents).toFixed(2)}</p>
                    <p className="text-xs text-[#5C6360]">revenue</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center py-4 bg-[#0D0F0F] rounded-lg">
              <p className="text-sm text-[#5C6360]">💡 Tip: Create more premium courses to increase revenue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};