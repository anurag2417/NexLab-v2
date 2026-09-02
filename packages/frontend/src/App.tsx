import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import { RootLayout } from './layouts/RootLayout';

// Public Pages
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentCourses } from './pages/student/Courses';
import { Sandbox } from './pages/student/Sandbox';
import { Leaderboard } from './pages/student/Leaderboard';
import { Profile } from './pages/student/Profile';

// Admin Pages (placeholders - we'll build these next)
const AdminDashboard: React.FC = () => <div className="py-8">Admin Dashboard - Coming soon</div>;
const AdminCourses: React.FC = () => <div className="py-8">Admin Courses - Coming soon</div>;
const AdminUsers: React.FC = () => <div className="py-8">Admin Users - Coming soon</div>;
const AdminAnalytics: React.FC = () => <div className="py-8">Admin Analytics - Coming soon</div>;
import { CourseForm } from './pages/admin/CourseForm';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly
}) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/courses" element={<StudentCourses />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute adminOnly><RootLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="courses/create" element={<CourseForm />} />
          <Route path="courses/edit/:id" element={<CourseForm />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;