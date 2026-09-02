import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, DollarSign, BookOpen, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { api } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalLessons: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes] = await Promise.all([
          api.get('/courses'),
        ]);
        
        const courses = coursesRes.data.data || [];
        const totalLessons = courses.reduce((acc: number, c: any) => acc + (c.lessons?.length || 0), 0);
        const totalStudents = courses.reduce((acc: number, c: any) => acc + (c.enrolledStudents?.length || 0), 0);
        const totalRevenue = courses.reduce((acc: number, c: any) => acc + (c.price * (c.enrolledStudents?.length || 0)), 0);

        setStats({
          totalStudents,
          totalCourses: courses.length,
          totalRevenue,
          totalLessons,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-heading">
            Admin Overview
          </h1>
          <p className="text-text-body mt-1">Here's what's happening with your platform today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users className="w-6 h-6" />} 
          color="primary" 
        />
        <StatCard 
          title="Total Courses" 
          value={stats.totalCourses} 
          icon={<GraduationCap className="w-6 h-6" />} 
          color="secondary" 
        />
        <StatCard 
          title="Revenue" 
          value={`$${stats.totalRevenue}`} 
          icon={<DollarSign className="w-6 h-6" />} 
          color="success" 
        />
        <StatCard 
          title="Total Lessons" 
          value={stats.totalLessons} 
          icon={<BookOpen className="w-6 h-6" />} 
          color="primary" 
        />
      </div>
    </div>
  );
};