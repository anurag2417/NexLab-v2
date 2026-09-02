import React from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Users, GraduationCap, DollarSign, Activity, PlusCircle } from 'lucide-react';

// Mock data
const stats = [
  { title: 'Total Students', value: '1,284', icon: <Users className="w-6 h-6" />, color: 'primary' as const, trend: { value: 12, isPositive: true } },
  { title: 'Courses Published', value: '24', icon: <GraduationCap className="w-6 h-6" />, color: 'secondary' as const, trend: { value: 4, isPositive: true } },
  { title: 'Revenue (Monthly)', value: '$4,230', icon: <DollarSign className="w-6 h-6" />, color: 'success' as const, trend: { value: 8, isPositive: true } },
  { title: 'Active Today', value: '342', icon: <Activity className="w-6 h-6" />, color: 'primary' as const, trend: { value: 2, isPositive: false } },
];

const recentActivity = [
  { user: 'Alice Johnson', action: 'Completed "React 101"', time: '2 mins ago' },
  { user: 'Bob Smith', action: 'Enrolled in "Python Pro"', time: '15 mins ago' },
  { user: 'Carol White', action: 'Scored 95% on Quiz #3', time: '1 hour ago' },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div>
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-heading">
            Admin Overview
          </h1>
          <p className="text-text-body mt-1">Here's what's happening with your platform today.</p>
        </div>
        <Button variant="secondary" className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Create New Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Charts / Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2 bg-background-light border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-heading mb-4">Weekly Engagement</h3>
          <div className="h-64 flex items-center justify-center bg-background-muted rounded-lg border border-dashed border-border">
            <span className="text-text-muted text-sm">📊 Chart Integration (Recharts coming soon)</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background-light border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-heading mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">
                  {item.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-text-heading">{item.user} <span className="text-text-body font-normal">{item.action}</span></p>
                  <p className="text-xs text-text-muted">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-4 text-primary-600">
            View All Activity
          </Button>
        </div>
      </div>
    </div>
  );
};