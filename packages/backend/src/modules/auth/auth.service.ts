// packages/backend/src/modules/auth/auth.service.ts

import jwt from 'jsonwebtoken';
import { Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.zod.js';
import { User } from './auth.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

// ✅ Helper to get IST date
const getISTDate = (date: Date = new Date()): Date => {
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcTime = date.getTime();
  const istTime = utcTime + istOffset;
  return new Date(istTime);
};

// ✅ Helper to get IST date string (YYYY-MM-DD)
const getISTDateString = (date: Date = new Date()): string => {
  const istDate = getISTDate(date);
  return istDate.toISOString().split('T')[0];
};

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
      secure: true,
      sameSite: 'none',
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

  // ---------- Update Login Streak with IST ----------
  static async updateStreak(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;

    // ✅ Use IST date
    const todayIST = getISTDateString();
    const lastLoginIST = user.lastLoginAt ? getISTDateString(user.lastLoginAt) : null;

    if (lastLoginIST === todayIST) {
      return;
    }

    // ✅ Check if yesterday in IST
    const yesterdayIST = new Date(getISTDate());
    yesterdayIST.setDate(yesterdayIST.getDate() - 1);
    const yesterdayStr = yesterdayIST.toISOString().split('T')[0];

    if (lastLoginIST === yesterdayStr) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1;
    }

    user.lastLoginAt = new Date(); // Store as UTC, but we'll display in IST
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();
  }
}