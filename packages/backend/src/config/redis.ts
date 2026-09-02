import { createClient } from 'redis';
import { env } from './env.zod.js';

export const redisClient = createClient({ 
  url: env.REDIS_URL,
  // Don't fail if Redis isn't available
  socket: {
    reconnectStrategy: () => new Error('Redis connection failed - continuing without cache')
  }
});

redisClient.on('error', (err) => {
  console.warn('⚠️ Redis not available - continuing without cache');
});

redisClient.on('connect', () => console.log('✅ Redis connected'));

// Don't await - let it fail gracefully
redisClient.connect().catch(() => {});