import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Home, BookOpen, Code2, Trophy, User, 
  Users, BarChart3, GraduationCap, LogOut, Menu, X,
  LayoutDashboard, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

// Student Navigation
const studentNav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
  { to: '/problems', icon: Code2, label: 'Practice Problems' },
  { to: '/sandbox', icon: LayoutDashboard, label: 'Sandbox' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

// Admin Navigation
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : studentNav;

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // ✅ Fixed: Sidebar is always fixed on desktop, collapsible on mobile
  const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';
  const isSidebarVisible = isMobile ? isSidebarOpen : true;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0D0F0F] flex w-full overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ✅ Sidebar - Fixed on all screen sizes */}
      <aside
        className={`
          ${isMobile ? 'fixed' : 'fixed'} 
          top-0 left-0 z-50 
          h-screen 
          ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${sidebarWidth} 
          bg-[#161A19] 
          border-r border-[#2A302E] 
          flex flex-col 
          transition-all duration-300 ease-in-out
          shadow-2xl
        `}
      >
        {/* Branding */}
        <div className={`px-4 h-16 flex items-center border-b border-[#2A302E] flex-shrink-0 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#10B981]">Nex</span>
              <span className="text-2xl font-bold text-[#EDEFEE]">Lab</span>
              <Sparkles className="w-4 h-4 text-[#10B981] ml-1" />
              <span className="ml-2 text-xs font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20 whitespace-nowrap">
                {isAdmin ? 'Admin' : 'Student'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#10B981]">N</span>
              <span className="text-2xl font-bold text-[#EDEFEE]">L</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-[#10B981]/10 text-[#10B981] border-r-2 border-[#10B981]' 
                  : 'text-[#9CA3A0] hover:bg-[#1E2322] hover:text-[#EDEFEE]'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User + Logout */}
        <div className={`border-t border-[#2A302E] p-4 flex-shrink-0 ${isCollapsed ? 'flex flex-col items-center gap-3' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center font-semibold border border-[#10B981]/20 flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#EDEFEE] truncate">{user?.name}</p>
                <p className="text-xs text-[#9CA3A0] truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-3 text-sm font-medium text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 mt-3 text-sm font-medium text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ✅ Collapse Toggle - Always visible on desktop */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 w-6 h-6 bg-[#1A1D1E] border border-[#2A302E] rounded-full flex items-center justify-center hover:bg-[#10B981]/20 hover:border-[#10B981] transition-colors z-50"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-[#9CA3A0]" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-[#9CA3A0]" />
            )}
          </button>
        )}
      </aside>

      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-[#161A19] border border-[#2A302E] shadow-lg"
        >
          {isSidebarOpen ? 
            <X className="w-5 h-5 text-[#EDEFEE]" /> : 
            <Menu className="w-5 h-5 text-[#EDEFEE]" />
          }
        </button>
      </div>

      {/* ✅ Main Content - Account for sidebar width */}
      <main 
        className={`
          flex-1 min-w-0 w-full overflow-y-auto
          transition-all duration-300 ease-in-out
          ${!isMobile && !isCollapsed ? 'ml-72' : ''}
          ${!isMobile && isCollapsed ? 'ml-20' : ''}
          ${isMobile ? 'ml-0' : ''}
        `}
        style={{
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};