import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Home, BookOpen, Code2, Trophy, User, 
  Users, BarChart3, GraduationCap, LogOut, Menu, X,
  LayoutDashboard, Sparkles
} from 'lucide-react';

// Student Navigation - Added "Practice Problems"
const studentNav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
  { to: '/problems', icon: Code2, label: 'Practice Problems' },
  { to: '/sandbox', icon: LayoutDashboard, label: 'Sandbox' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

// Admin Navigation - Added "Coding Problems"
const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/courses', icon: GraduationCap, label: 'Manage Courses' },
  { to: '/admin/problems', icon: Code2, label: 'Coding Problems' },
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
    <div className="min-h-screen bg-[#0D0F0F] flex">
      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-[#161A19] border border-[#2A302E] shadow-lg"
        >
          {isSidebarOpen ? 
            <X className="w-5 h-5 text-[#EDEFEE]" /> : 
            <Menu className="w-5 h-5 text-[#EDEFEE]" />
          }
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 z-40 h-screen w-72 bg-[#161A19] border-r border-[#2A302E] flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Branding */}
        <div className="px-6 h-16 flex items-center border-b border-[#2A302E] flex-shrink-0">
          <span className="text-2xl font-bold text-[#10B981]">Nex</span>
          <span className="text-2xl font-bold text-[#EDEFEE]">Lab</span>
          <Sparkles className="w-4 h-4 text-[#10B981] ml-1" />
          <span className="ml-2 text-xs font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
            {isAdmin ? 'Admin' : 'Student'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-[#10B981]/10 text-[#10B981] border-r-2 border-[#10B981]' 
                  : 'text-[#9CA3A0] hover:bg-[#1E2322] hover:text-[#EDEFEE]'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User + Logout */}
        <div className="border-t border-[#2A302E] p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center font-semibold border border-[#10B981]/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#EDEFEE] truncate">{user?.name}</p>
              <p className="text-xs text-[#9CA3A0] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
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