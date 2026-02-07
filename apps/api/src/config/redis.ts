import Redis from 'ioredis';
import config from './index';
import { logger } from '../utils/logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('connect', () => {
  logger.info(`Redis connected to ${config.redis.host}:${config.redis.port}`);
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('ready', () => {
  logger.info('Redis is ready');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit();
});

export { redis };
