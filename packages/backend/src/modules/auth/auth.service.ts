import jwt from 'jsonwebtoken';
import { Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.zod.js';
import { User } from './auth.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export class AuthService {
  // ---------- Token Generation ----------
  static generateToken(userId: string, email: string): string {
    return jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ---------- Cookie Management ----------
  static setTokenCookie(res: Response, userId: string, email: string) {
    const token = this.generateToken(userId, email);

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // ✅ Always true in production for cross-site
      sameSite: 'none', // ✅ Change from 'lax' to 'none' for cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      ...(isProduction ? { partitioned: true } : {}),
    });
  }

  static clearTokenCookie(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      ...(isProduction ? { partitioned: true } : {}),
    });
  }

  // ---------- Verification ----------
  static async verifyEmail(token: string): Promise<boolean> {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) return false;

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return true;
  }

  // ---------- Password Reset ----------
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return false;

    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    user.password = await bcrypt.default.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return true;
  }

  // ---------- Update Leaderboard ----------
  static async updateLeaderboard(userId: string, xp: number): Promise<void> {
    await LeaderboardService.updateUserScore(userId, xp);
  }

  // ---------- Update Login Streak ----------
  static async updateStreak(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date().toDateString();
    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toDateString() : null;

    if (lastLogin === today) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastLogin === yesterdayStr) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1;
    }

    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();
  }
}