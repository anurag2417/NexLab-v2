import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../config/env.zod.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export class AuthService {
  static generateToken(userId: string, email: string): string {
    return jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static setTokenCookie(res: Response, userId: string, email: string) {
    const token = this.generateToken(userId, email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  static clearTokenCookie(res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  }

  // Update leaderboard when XP changes
  static async updateLeaderboard(userId: string, xp: number): Promise<void> {
    await LeaderboardService.updateUserScore(userId, xp);
  }
}