import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search,
  Code2, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  createdBy?: { name: string };
  testCases?: any[];
  submissions?: number;
}

export const AdminProblems: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, [currentPage, difficultyFilter]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/problems/admin/all?page=${currentPage}&limit=20&search=${search}&difficulty=${difficultyFilter}`
      );
      const data = response.data;
      setProblems(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const response = await api.patch(`/problems/${id}/publish`);
      setProblems(problems.map(p => p._id === id ? response.data.data : p));
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Failed to update problem status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    setActionLoading(id);
    try {
      await api.delete(`/problems/${id}`);
      setProblems(problems.filter(p => p._id !== id));
      alert('Problem deleted successfully!');
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem');
    } finally {
      setActionLoading(null);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
      medium: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
      hard: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30',
    };
    return colors[difficulty] || 'bg-[#2A302E] text-[#9CA3A0]';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProblems();
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
            <Code2 className="w-8 h-8 text-[#10B981]" />
            Coding Problems
          </h1>
          <p className="text-[#9CA3A0] mt-1">Create, edit, and manage coding challenges</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/problems/create')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Problem
        </Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
          <input
            type="text"
            placeholder="Search problems by title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
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
              setDifficultyFilter('');
              setCurrentPage(1);
              fetchProblems();
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
          <p className="text-sm text-[#9CA3A0]">Total Problems</p>
          <p className="text-2xl font-bold text-[#EDEFEE]">{problems.length}</p>
        </div>
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
          <p className="text-sm text-[#9CA3A0]">Published</p>
          <p className="text-2xl font-bold text-[#10B981]">{problems.filter(p => p.isPublished).length}</p>
        </div>
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4">
          <p className="text-sm text-[#9CA3A0]">Drafts</p>
          <p className="text-2xl font-bold text-[#FBBF24]">{problems.filter(p => !p.isPublished).length}</p>
        </div>
      </div>

      {/* Problems List */}
      {problems.length === 0 ? (
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-12 text-center">
          <Code2 className="w-12 h-12 text-[#5C6360] mx-auto mb-4 opacity-40" />
          <p className="text-[#9CA3A0]">No problems found. Create your first problem!</p>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/problems/create')}
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Problem
          </Button>
        </div>
      ) : (
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A302E] bg-[#0D0F0F]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem) => (
                  <tr
                    key={problem._id}
                    className="border-b border-[#2A302E] hover:bg-[#1E2322] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-[#EDEFEE]">{problem.title}</p>
                        <p className="text-xs text-[#5C6360]">/{problem.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getDifficultyBadge(problem.difficulty)}`}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags?.slice(0, 2).map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-0.5 rounded bg-[#2A302E] text-[#5C6360]">
                            {tag}
                          </span>
                        ))}
                        {problem.tags?.length > 2 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-[#2A302E] text-[#5C6360]">
                            +{problem.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {problem.isPublished ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-[#5C6360]">
                      {new Date(problem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTogglePublish(problem._id, problem.isPublished)}
                          disabled={actionLoading === problem._id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            problem.isPublished 
                              ? 'text-[#FBBF24] hover:bg-[#FBBF24]/10' 
                              : 'text-[#10B981] hover:bg-[#10B981]/10'
                          }`}
                          title={problem.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {actionLoading === problem._id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : problem.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/problems/edit/${problem._id}`)}
                          className="p-1.5 text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(problem._id, problem.title)}
                          disabled={actionLoading === problem._id}
                          className="p-1.5 text-[#9CA3A0] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A302E]">
              <p className="text-sm text-[#5C6360]">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
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
      )}
    </div>
  );
};