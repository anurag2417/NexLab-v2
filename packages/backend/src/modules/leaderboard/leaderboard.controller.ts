import { Request, Response } from 'express';
import { LeaderboardService } from './leaderboard.service.js';

export class LeaderboardController {
  // Get top users with details
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const maxLimit = 100;
      const finalLimit = Math.min(limit, maxLimit);

      const leaderboard = await LeaderboardService.getLeaderboardWithDetails(finalLimit);

      // Get current user's rank if authenticated
      let userRank = null;
      if (req.userId) {
        const rankData = await LeaderboardService.getUserRank(req.userId);
        if (rankData) {
          userRank = rankData;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          leaderboard,
          userRank,
          total: leaderboard.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch leaderboard',
      });
    }
  }

  // Update a user's score (called when XP changes)
  static async updateScore(req: Request, res: Response) {
    try {
      const { userId, xp } = req.body;

      if (!userId || xp === undefined) {
        return res.status(400).json({
          success: false,
          message: 'userId and xp are required',
        });
      }

      await LeaderboardService.updateUserScore(userId, xp);

      res.status(200).json({
        success: true,
        message: 'Score updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating score:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update score',
      });
    }
  }

  // Rebuild leaderboard (admin only)
  static async rebuild(req: Request, res: Response) {
    try {
      await LeaderboardService.rebuildLeaderboard();

      res.status(200).json({
        success: true,
        message: 'Leaderboard rebuilt successfully',
      });
    } catch (error: any) {
      console.error('Error rebuilding leaderboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to rebuild leaderboard',
      });
    }
  }
}