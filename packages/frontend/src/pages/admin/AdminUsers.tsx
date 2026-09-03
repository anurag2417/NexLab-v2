import React, { useState, useEffect } from 'react';
//import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, ChevronLeft, ChevronRight,
  Edit2, Trash2, Eye
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Student {
  _id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  enrolledCourses: string[];
  enrolledCoursesCount: number;
  rank: number | null;
  createdAt: string;
  updatedAt: string;
}

export const AdminUsers: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    newStudents: 0,
  });
  const pageSize = 10;

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [currentPage, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students?page=${currentPage}&limit=${pageSize}&search=${search}`);
      const data = response.data.data;
      setStudents(data.students || []);
      setTotalPages(data.pagination.totalPages);
      setTotalStudents(data.pagination.total);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/students/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/admin/students/${id}`);
      await fetchStudents();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'text-[#10B981]';
    if (level <= 6) return 'text-[#60A5FA]';
    if (level <= 10) return 'text-[#FBBF24]';
    return 'text-[#F87171]';
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-xs text-[#5C6360]">#{rank}</span>;
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
            <Users className="w-8 h-8 text-[#10B981]" />
            Students
          </h1>
          <p className="text-[#9CA3A0] mt-1">Manage and monitor all students on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStudents}
            className="gap-1"
          >
            <Search className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
          <p className="text-sm text-[#9CA3A0]">Total Students</p>
          <p className="text-2xl font-bold text-[#10B981]">{stats.totalStudents}</p>
        </div>
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
          <p className="text-sm text-[#9CA3A0]">Active Students (30 days)</p>
          <p className="text-2xl font-bold text-[#60A5FA]">{stats.activeStudents}</p>
        </div>
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
          <p className="text-sm text-[#9CA3A0]">New Students (7 days)</p>
          <p className="text-2xl font-bold text-[#FBBF24]">{stats.newStudents}</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
                fetchStudents();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Students Table */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A302E] bg-[#0D0F0F]">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Level
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  XP
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Courses
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Streak
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#9CA3A0]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student._id}
                    className="border-b border-[#2A302E] hover:bg-[#1E2322] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-semibold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[#EDEFEE]">{student.name}</p>
                          <p className="text-xs text-[#5C6360]">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {getRankBadge(student.rank)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${getLevelColor(student.level || 1)}`}>
                        {student.level || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-[#10B981]">{student.xp || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[#EDEFEE]">{student.enrolledCoursesCount || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[#FBBF24]">{student.streak || 0}🔥</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-[#5C6360]">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => alert(`View details for ${student.name}`)}
                          className="p-1.5 text-[#9CA3A0] hover:text-[#60A5FA] hover:bg-[#60A5FA]/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert(`Edit ${student.name}`)}
                          className="p-1.5 text-[#9CA3A0] hover:text-[#FBBF24] hover:bg-[#FBBF24]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id, student.name)}
                          className="p-1.5 text-[#9CA3A0] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A302E]">
            <p className="text-sm text-[#5C6360]">
              Showing {students.length} of {totalStudents} students
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#9CA3A0]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#5C6360]">
        <div className="flex items-center gap-1">
          <span className="text-lg">🥇</span>
          <span>Gold (Rank 1)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">🥈</span>
          <span>Silver (Rank 2)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">🥉</span>
          <span>Bronze (Rank 3)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#10B981]">●</span>
          <span>Level 1-3</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#60A5FA]">●</span>
          <span>Level 4-6</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#FBBF24]">●</span>
          <span>Level 7-10</span>
        </div>
      </div>
    </div>
  );
};