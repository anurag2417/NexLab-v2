import { redisClient } from '../../config/redis.js';
import { User } from '../auth/auth.model.js';

export class LeaderboardService {
  private static readonly LEADERBOARD_KEY = 'leaderboard:xp';
  private static readonly CACHE_TTL = 60; // seconds

  // Update a user's score in the leaderboard
  static async updateUserScore(userId: string, xp: number): Promise<void> {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not available - leaderboard update skipped');
      return;
    }

    try {
      await redisClient.zAdd(this.LEADERBOARD_KEY, {
        score: xp,
        value: userId,
      });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  // Get top users from leaderboard
  static async getTopUsers(limit: number = 50): Promise<{ userId: string; xp: number; rank: number }[]> {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not available - returning empty leaderboard');
      return [];
    }

    try {
      const results = await redisClient.zRangeWithScores(
        this.LEADERBOARD_KEY,
        0,
        limit - 1,
        { REV: true }
      );

      return results.map((item, index) => ({
        userId: item.value,
        xp: Math.round(item.score),
        rank: index + 1,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Get a user's rank and score
  static async getUserRank(userId: string): Promise<{ rank: number; xp: number } | null> {
    if (!redisClient.isReady) {
      return null;
    }

    try {
      const rank = await redisClient.zRevRank(this.LEADERBOARD_KEY, userId);
      const score = await redisClient.zScore(this.LEADERBOARD_KEY, userId);

      if (rank === null || score === null) {
        return null;
      }

      return {
        rank: rank + 1,
        xp: Math.round(score),
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }

  // Get leaderboard with user details
  static async getLeaderboardWithDetails(limit: number = 50): Promise<any[]> {
    const topUsers = await this.getTopUsers(limit);
    
    if (topUsers.length === 0) {
      return [];
    }

    // Get user details from database
    const userIds = topUsers.map(u => u.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email _id xp level badges')
      .lean();

    // Create a map for quick lookup
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });

    // Combine leaderboard data with user details
    return topUsers
      .map(item => {
        const user = userMap.get(item.userId);
        if (!user) return null;
        
        return {
          rank: item.rank,
          userId: item.userId,
          name: user.name,
          email: user.email,
          xp: item.xp,
          level: user.level || 1,
          badges: user.badges || [],
        };
      })
      .filter(Boolean);
  }

  // Bulk update leaderboard (for initialization)
  static async rebuildLeaderboard(): Promise<void> {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not available - cannot rebuild leaderboard');
      return;
    }

    try {
      // Clear existing leaderboard
      await redisClient.del(this.LEADERBOARD_KEY);

      // Get all users with their XP
      const users = await User.find().select('_id xp').lean();
      
      // Add all users to leaderboard
      const pipeline = redisClient.multi();
      for (const user of users) {
        pipeline.zAdd(this.LEADERBOARD_KEY, {
          score: user.xp || 0,
          value: user._id.toString(),
        });
      }
      await pipeline.exec();

      console.log(`✅ Leaderboard rebuilt with ${users.length} users`);
    } catch (error) {
      console.error('Error rebuilding leaderboard:', error);
    }
  }
}