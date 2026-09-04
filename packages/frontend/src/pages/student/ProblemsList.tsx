import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, Clock, AlertCircle, Code2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  isPublished: boolean;
}

export const ProblemsList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);

  useEffect(() => {
    fetchProblems();
  }, [currentPage, difficultyFilter, search]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/problems?page=${currentPage}&limit=20&search=${encodeURIComponent(search)}&difficulty=${difficultyFilter}`
      );
      
      const data = response.data;
      const problemsData = data.data || [];
      
      const formattedProblems = problemsData.map((p: any) => ({
        _id: p._id || p.id,
        title: p.title || 'Untitled Problem',
        slug: p.slug || p._id || p.id || 'problem',
        difficulty: p.difficulty || 'easy',
        tags: p.tags || [],
        createdAt: p.createdAt || new Date().toISOString(),
        isPublished: p.isPublished !== false,
      }));
      
      setProblems(formattedProblems);
      setTotalProblems(data.pagination?.total || formattedProblems.length);
      setTotalPages(Math.ceil((data.pagination?.total || formattedProblems.length) / 20) || 1);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-[#10B981]/20 text-[#10B981]',
      medium: 'bg-[#FBBF24]/20 text-[#FBBF24]',
      hard: 'bg-[#F87171]/20 text-[#F87171]',
    };
    return colors[difficulty] || 'bg-[#2A302E] text-[#9CA3A0]';
  };

  const getDifficultyIcon = (difficulty: string) => {
    const icons: Record<string, JSX.Element> = {
      easy: <CheckCircle className="w-4 h-4 text-[#10B981]" />,
      medium: <Clock className="w-4 h-4 text-[#FBBF24]" />,
      hard: <AlertCircle className="w-4 h-4 text-[#F87171]" />,
    };
    return icons[difficulty] || <CheckCircle className="w-4 h-4 text-[#5C6360]" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFEE] flex items-center gap-2">
            <Code2 className="w-8 h-8 text-[#10B981]" />
            Coding Problems
          </h1>
          <p className="text-[#9CA3A0] mt-1">
            Solve coding challenges and improve your skills
            {totalProblems > 0 && (
              <span className="ml-2 text-[#10B981]">({totalProblems} problems)</span>
            )}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchProblems} className="gap-1">
          🔄 Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6360]" />
          <input
            type="text"
            placeholder="Search problems by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
          >
            <option value="">All Difficulties</option>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
          <Button variant="secondary" size="sm" onClick={() => {
            setSearch('');
            setDifficultyFilter('');
            setCurrentPage(1);
            fetchProblems();
          }}>
            Clear
          </Button>
        </div>
      </div>

      {problems.length === 0 ? (
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-12 text-center">
          <Code2 className="w-12 h-12 text-[#5C6360] mx-auto mb-4 opacity-40" />
          <p className="text-[#9CA3A0]">No problems found</p>
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
                  <th className="text-right py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem) => (
                  <tr key={problem._id} className="border-b border-[#2A302E] hover:bg-[#1E2322] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getDifficultyIcon(problem.difficulty)}
                        <Link 
                          to={`/problems/${problem.slug}`}
                          className="text-[#EDEFEE] hover:text-[#10B981] transition-colors font-medium"
                        >
                          {problem.title}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getDifficultyBadge(problem.difficulty)}`}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags?.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-0.5 rounded bg-[#2A302E] text-[#5C6360]">
                            {tag}
                          </span>
                        ))}
                        {problem.tags?.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-[#2A302E] text-[#5C6360]">
                            +{problem.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/problems/${problem.slug}`}>
                        <Button variant="primary" size="sm">Solve</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A302E]">
              <p className="text-sm text-[#5C6360]">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};