import { connectRedis } from '../config/redis.js';
import redisClient from '../config/redis.js';
import { jobPipelineService } from '../config/services.js';
import logger from '../shared/utils/logger.js';


async function main(): Promise<void> {
  logger.info('Daily job pipeline started');

  await connectRedis();

  if (!redisClient.isOpen) {
    throw new Error('Redis is not connected. Check REDIS_URL secret.');
  }

  const result = await jobPipelineService.run();

  logger.info(
    `Daily job pipeline finished: ${JSON.stringify(result)}`,
  );

  if (result.subscribers === 0) {
    logger.warn('No subscribed users found in Redis. Nothing was sent.');
  }

  await redisClient.quit();
  process.exit(0);
}

main().catch(async (error) => {
  logger.error(
    `Daily job pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
  );

  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch {
    
  }

  process.exit(1);
});
