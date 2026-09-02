import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../config/env.zod.js';

export class AuthService {
  static setTokenCookie(res: Response, userId: string, email: string) {
    const token = jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to false for local development (no HTTPS)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/', // ✅ CRITICAL: Cookie available for all paths
      domain: 'localhost', // ✅ CRITICAL: Set domain
    });

    console.log('🍪 Cookie set:', {
      path: '/',
      domain: 'localhost',
      secure: false,
      sameSite: 'lax',
    });
  }

  static clearTokenCookie(res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      domain: 'localhost',
    });
  }
}