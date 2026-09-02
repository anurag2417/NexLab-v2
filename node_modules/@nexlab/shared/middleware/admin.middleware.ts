import { Request, Response, NextFunction } from 'express';
import { User } from '../../backend/src/modules/auth/auth.model';

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying admin status',
    });
  }
};