import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.zod.js';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      userEmail: string;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 Authenticate middleware called');
  console.log('🍪 Cookies:', req.cookies);
  console.log('📋 Authorization header:', req.headers.authorization);

  // Try to get token from cookie
  let token = req.cookies?.token;

  // If not in cookies, try Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 Token from Authorization header');
    }
  }

  if (!token) {
    console.warn('⚠️ No token found');
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    console.log('✅ Token verified for user:', decoded.id);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.clearCookie('token');
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Invalid token',
    });
  }
};