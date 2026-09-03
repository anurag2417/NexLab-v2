import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { 
  Crown, Medal, Trophy, Star, 
  TrendingUp, Users, Award, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  badges: string[];
}

interface UserRank {
  rank: number;
  xp: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard?limit=${pageSize * currentPage}`);
      const data = response.data.data;
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank || null);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-[#FBBF24]" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-[#9CA3A0]" />;
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-[#D4A373]" />;
    } else {
      return <span className="text-sm font-medium text-[#5C6360]">#{rank}</span>;
    }
  };

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'text-[#10B981]';
    if (level <= 6) return 'text-[#60A5FA]';
    if (level <= 10) return 'text-[#FBBF24]';
    return 'text-[#F87171]';
  };

  const getBadgeIcon = (badge: string) => {
    const badgeMap: Record<string, string> = {
      'First Steps': '🎓',
      'Dedicated Learner': '📚',
      'Master Student': '🏆',
      'Streak Starter': '🔥',
      'Code Warrior': '⚔️',
      'Quick Learner': '⚡',
    };
    return badgeMap[badge] || '🏅';
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2A302E]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#EDEFEE] flex items-center gap-2">
            <Trophy className="w-8 h-8 text-[#FBBF24]" />
            Leaderboard
          </h1>
          <p className="text-[#9CA3A0] mt-1">Top students ranked by experience points</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchLeaderboard}
          className="gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <div className="bg-[#161A19] border border-[#10B981]/20 rounded-xl p-5 mb-8 shadow-sm shadow-[#10B981]/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/20 border-2 border-[#10B981] flex items-center justify-center">
                <span className="text-xl font-bold text-[#10B981]">
                  #{userRank.rank}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#9CA3A0]">Your Rank</p>
                <p className="text-lg font-bold text-[#EDEFEE]">{user?.name || 'You'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-[#9CA3A0]">XP</p>
                <p className="text-xl font-bold text-[#10B981]">{userRank.xp}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#9CA3A0]">Level</p>
                <p className={`text-xl font-bold ${getLevelColor(user?.level || 1)}`}>
                  {user?.level || 1}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A302E] bg-[#0D0F0F]">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Student
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Level
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  XP
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#5C6360] uppercase tracking-wider">
                  Badges
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#9CA3A0]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    No users on the leaderboard yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => {
                  const isCurrentUser = entry.userId === user?._id;
                  return (
                    <tr
                      key={entry.userId}
                      className={`border-b border-[#2A302E] transition-colors ${
                        isCurrentUser ? 'bg-[#10B981]/5 hover:bg-[#10B981]/10' : 'hover:bg-[#1E2322]'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                            isCurrentUser 
                              ? 'bg-[#10B981] text-white' 
                              : 'bg-[#2A302E] text-[#EDEFEE]'
                          }`}>
                            {entry.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className={`font-medium ${isCurrentUser ? 'text-[#10B981]' : 'text-[#EDEFEE]'}`}>
                              {entry.name}
                              {isCurrentUser && ' (You)'}
                            </p>
                            <p className="text-xs text-[#5C6360]">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${getLevelColor(entry.level || 1)}`}>
                          {entry.level || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[#10B981]">{entry.xp}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {entry.badges && entry.badges.length > 0 ? (
                            entry.badges.slice(0, 3).map((badge, index) => (
                              <span
                                key={index}
                                className="text-lg"
                                title={badge}
                              >
                                {getBadgeIcon(badge)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#5C6360]">-</span>
                          )}
                          {entry.badges && entry.badges.length > 3 && (
                            <span className="text-xs text-[#5C6360]">+{entry.badges.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A302E]">
            <p className="text-sm text-[#5C6360]">
              Showing {leaderboard.length} of {totalUsers} students
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
          <Crown className="w-4 h-4 text-[#FBBF24]" />
          <span>Gold</span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-[#9CA3A0]" />
          <span>Silver</span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-[#D4A373]" />
          <span>Bronze</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-[#10B981]" />
          <span>Your rank highlighted</span>
        </div>
      </div>
    </div>
  );
};