import { createClient } from 'redis';

import env from './env.js';
import logger from '../shared/utils/logger.js';

const redisClient = createClient({
  url: env.redisUrl,
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected');
});

redisClient.on('error', (err) => {
  logger.error(`❌ Redis error: ${err.message}`);
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(
      `❌ Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export default redisClient;
