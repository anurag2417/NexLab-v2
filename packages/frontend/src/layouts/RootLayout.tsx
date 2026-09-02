import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Home, BookOpen, Code2, Trophy, User, Settings, 
  Users, BarChart3, GraduationCap, LogOut, Menu, X,
  LayoutDashboard 
} from 'lucide-react';

// Student Navigation
const studentNav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/sandbox', icon: Code2, label: 'Sandbox' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

// Admin Navigation
const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/courses', icon: GraduationCap, label: 'Manage Courses' },
  { to: '/admin/users', icon: Users, label: 'Students' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export const RootLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : studentNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background-muted flex">
      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md border border-border"
        >
          {isSidebarOpen ? <X className="w-5 h-5 text-text-heading" /> : <Menu className="w-5 h-5 text-text-heading" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 z-40 h-screen w-72 bg-background-light border-r border-border flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Branding */}
        <div className="px-6 h-16 flex items-center border-b border-border flex-shrink-0">
          <span className="text-2xl font-bold text-primary-600">Nex</span>
          <span className="text-2xl font-bold text-text-heading">Lab</span>
          <span className="ml-2 text-xs font-medium bg-secondary-500 text-white px-2 py-0.5 rounded-full">
            {isAdmin ? 'Admin' : 'Student'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 text-primary-600 shadow-sm' 
                  : 'text-text-body hover:bg-background-muted hover:text-text-heading'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User + Logout */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-heading truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};