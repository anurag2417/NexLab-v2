import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../config/env.zod.js';

export class AuthService {
  static generateToken(userId: string, email: string): string {
    return jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static setTokenCookie(res: Response, userId: string, email: string) {
    const token = this.generateToken(userId, email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      // Add partitioned attribute for Chrome
      partitioned: true,
    });
  }

  static clearTokenCookie(res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      partitioned: true,
    });
  }
}