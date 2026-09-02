import React from 'react';
import { useAuthStore } from '../../stores/authStore';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-text-heading">Welcome, {user?.name}!</h1>
      <p className="text-text-body mt-2">Student Dashboard - Coming soon!</p>
      <div className="mt-8 p-6 bg-secondary-50 border border-secondary-200 rounded-lg">
        <p className="text-secondary-700">🎯 Your XP: {user?.xp || 0} | Level: {user?.level || 1}</p>
      </div>
    </div>
  );
};