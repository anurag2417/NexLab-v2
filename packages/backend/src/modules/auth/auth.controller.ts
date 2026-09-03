import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { User } from './auth.model.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  // ---------- Register ----------
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = registerSchema.parse(req.body);

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: 'student',
        isVerified: true, // Auto-verify for now
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
        enrolledCourses: [],
        progress: new Map(),
        isActive: true,
      });

      AuthService.setTokenCookie(res, user._id.toString(), user.email);

      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          badges: user.badges,
          avatar: user.avatar,
          isVerified: user.isVerified,
          enrolledCourses: user.enrolledCourses || [],
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  // ---------- Login ----------
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      await AuthService.updateStreak(user._id.toString());

      AuthService.setTokenCookie(res, user._id.toString(), user.email);

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          badges: user.badges,
          avatar: user.avatar,
          isVerified: user.isVerified,
          enrolledCourses: user.enrolledCourses || [],
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  // ---------- Logout ----------
  static async logout(req: Request, res: Response) {
    AuthService.clearTokenCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  // ---------- Get Current User ----------
  static async me(req: Request, res: Response) {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          badges: user.badges,
          avatar: user.avatar,
          isVerified: user.isVerified,
          enrolledCourses: user.enrolledCourses || [],
          loginCount: user.loginCount,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Me endpoint error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user',
      });
    }
  }
}