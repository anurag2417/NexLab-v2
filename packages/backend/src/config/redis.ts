import { createClient } from 'redis';
import { env } from './env.zod.js';

export const redisClient = createClient({ 
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: () => {
      // Don't reconnect - we'll handle Redis absence gracefully
      return new Error('Redis connection failed - continuing without cache');
    }
  }
});

redisClient.on('error', (err) => {
  console.warn('⚠️ Redis not available - continuing without cache:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

// Don't await - let it fail gracefully
redisClient.connect().catch(() => {
  // Ignore connection errors - we'll handle them gracefully
});