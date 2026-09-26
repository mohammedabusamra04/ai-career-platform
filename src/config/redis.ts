import { createClient } from 'redis';

import env from './env.js';
import logger from '../shared/utils/logger.js';

const redisClient = createClient({
  url: env.redisUrl,
  socket: {
    /*
     * Keep the TCP socket alive so cloud providers / proxies do not silently
     * drop an idle connection (the cause of `read ECONNRESET`).
     */
    keepAlive: true,
    connectTimeout: 10_000,
    /*
     * Reconnect forever with capped backoff. Returning an Error stops
     * reconnection entirely, so we never return one here.
     */
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 3_000);
      logger.warn(`Redis reconnecting (attempt ${retries + 1}) in ${delay}ms`);
      return delay;
    },
  },
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('🔄 Redis reconnecting...');
});

redisClient.on('end', () => {
  logger.warn('⚠️ Redis connection closed');
});

redisClient.on('error', (err) => {
  logger.error(`❌ Redis error: ${err.message}`);
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(
      `❌ Failed to connect to Redis: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
    /*
     * Do not swallow this. If the initial connection fails, the pipeline must
     * fail fast instead of running with a dead client and erroring on every
     * SET later.
     */
    throw error;
  }
}

export default redisClient;