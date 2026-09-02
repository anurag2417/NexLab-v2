import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { User } from './auth.model.js';
import { z } from 'zod';

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
  static async register(req: Request, res: Response) {
    const { name, email, password } = registerSchema.parse(req.body);

    const user = await AuthService.register(name, email, password);
    AuthService.setTokenCookie(res, user._id.toString(), user.email);

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level },
    });
  }

  static async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);

    const user = await AuthService.login(email, password);
    AuthService.setTokenCookie(res, user._id.toString(), user.email);

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level },
    });
  }

  static async logout(req: Request, res: Response) {
    AuthService.clearTokenCookie(res);
    res.status(200).json({ success: true, message: 'Logged out' });
  }

  static async me(req: Request, res: Response) {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  }
}