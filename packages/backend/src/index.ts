import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.zod.js';
import { connectDB } from './config/database.js';
import { redisClient } from './config/redis.js';
import { logger } from './shared/logger.js';

// Import Routes
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/courses/course.routes.js';  // ✅ Make sure this exists
import sandboxRoutes from './modules/sandbox/sandbox.routes.js';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes.js';
import userRoutes from './modules/user/user.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import quizRoutes from './modules/quizzes/quiz.routes.js';
import problemRoutes from './modules/problems/problem.routes.js';

// --- Init App ---
const app = express();

// 1. Security Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://nexlab-v2.vercel.app',
    'https://nexlab-v2.onrender.com'
  ],
  credentials: true, // ✅ Must be true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}))
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// 2. Global Rate Limiter
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 3. Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);  // ✅ Make sure this line exists
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/problems', problemRoutes);

// Test auth endpoint (no auth required)
app.get('/api/test-auth', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    cookies: req.cookies,
    hasToken: !!req.cookies?.token
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', redis: redisClient.isReady });
});

// 4. Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// 5. Start Server
await connectDB();
app.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
});