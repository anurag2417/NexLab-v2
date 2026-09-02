import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../config/env.zod.js';

export class AuthService {
  // Generate JWT token
  static generateToken(userId: string, email: string): string {
    return jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  // Set token as httpOnly cookie
  static setTokenCookie(res: Response, userId: string, email: string) {
    const token = this.generateToken(userId, email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    console.log('🍪 Cookie set successfully for user:', userId);
  }

  static clearTokenCookie(res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  }
}