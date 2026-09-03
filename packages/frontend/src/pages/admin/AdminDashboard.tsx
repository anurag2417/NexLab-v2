import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalLessons: number;
  totalRevenue: number;
  totalEnrollments: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalLessons: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [coursesRes] = await Promise.all([
        api.get('/courses/admin/all'),
      ]);
      
      const courses = coursesRes.data.data || [];
      const published = courses.filter((c: any) => c.isPublished);
      const totalLessons = courses.reduce((acc: number, c: any) => acc + (c.lessons?.length || 0), 0);
      const totalStudents = courses.reduce((acc: number, c: any) => acc + (c.enrolledStudents?.length || 0), 0);
      const totalRevenue = courses.reduce((acc: number, c: any) => acc + (c.price * (c.enrolledStudents?.length || 0)), 0);
      const totalEnrollments = courses.reduce((acc: number, c: any) => acc + (c.enrolledStudents?.length || 0), 0);

      setStats({
        totalStudents,
        totalCourses: courses.length,
        publishedCourses: published.length,
        totalLessons,
        totalRevenue,
        totalEnrollments,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2A302E]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#EDEFEE]">Admin Overview</h1>
          <p className="text-[#9CA3A0] mt-1">Here's what's happening with your platform</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/courses/create')}
          className="gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Create New Course
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users className="w-6 h-6 text-[#10B981]" />} 
          color="emerald"
        />
        <StatCard 
          title="Total Courses" 
          value={stats.totalCourses} 
          icon={<GraduationCap className="w-6 h-6 text-[#60A5FA]" />} 
          color="info"
        />
        <StatCard 
          title="Published" 
          value={stats.publishedCourses} 
          icon={<Eye className="w-6 h-6 text-[#FBBF24]" />} 
          color="warning"
        />
        <StatCard 
          title="Total Lessons" 
          value={stats.totalLessons} 
          icon={<BookOpen className="w-6 h-6 text-[#F87171]" />} 
          color="error"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <p className="text-sm text-[#9CA3A0]">Total Revenue</p>
          <p className="text-2xl font-bold text-[#10B981]">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <p className="text-sm text-[#9CA3A0]">Total Enrollments</p>
          <p className="text-2xl font-bold text-[#60A5FA]">{stats.totalEnrollments}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/courses/create')}
            className="gap-2 w-full justify-center"
          >
            <BookOpen className="w-4 h-4" />
            Create Course
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/courses')}
            className="gap-2 w-full justify-center"
          >
            <GraduationCap className="w-4 h-4" />
            Manage Courses
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/users')}
            className="gap-2 w-full justify-center"
          >
            <Users className="w-4 h-4" />
            Manage Students
          </Button>
        </div>
      </div>
    </div>
  );
};