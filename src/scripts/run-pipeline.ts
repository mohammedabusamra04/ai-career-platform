import { connectRedis } from '../config/redis.js';
import redisClient from '../config/redis.js';
import { jobPipelineService } from '../config/services.js';
import logger from '../shared/utils/logger.js';
import env from '../config/env.js';
import { NotificationScheduleService } from '../modules/notifications/notification.schedule.js';


async function main(): Promise<void> {
  logger.info('Daily job pipeline started');

  const forceRun = process.env.FORCE_RUN === 'true';
  const scheduleService = new NotificationScheduleService();

  if (
    !forceRun &&
    !scheduleService.isWithinRunWindow(env.timezone, [
      env.jobRunTime1,
      env.jobRunTime2,
    ])
  ) {
    logger.info(
      `Outside the notification window for ${env.timezone}; skipping this trigger.`,
    );
    process.exit(0);
  }

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
  } catch (quitError) {
    logger.warn(
      `Failed to close Redis connection during exit: ${
        quitError instanceof Error ? quitError.message : String(quitError)
      }`,
    );
  }


  process.exit(1);
});
