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
  console.log('📋 Authorization header:', req.headers.authorization);
  console.log('🍪 Cookie header:', req.headers.cookie);

  // FIRST: Try to get token from Authorization header
  let token = null;
  
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 Token from Authorization header');
    }
  }

  // SECOND: If not in header, try cookie
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
    console.log('🔑 Token from cookie');
  }

  if (!token) {
    console.warn('⚠️ No token found in headers or cookies');
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
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Invalid token',
    });
  }
};