import { connectRedis } from '../config/redis.js';
import redisClient from '../config/redis.js';
import { jobPipelineService } from '../config/services.js';
import logger from '../shared/utils/logger.js';
import env from '../config/env.js';
import { NotificationScheduleService } from '../modules/notifications/notification.schedule.js';

const SLOT_KEY_PREFIX = 'pipeline:slot:';
const SLOT_TTL_SECONDS = 36 * 60 * 60;
/** GitHub's cron can fire late; catch up on a missed slot for at most this long. */
const MAX_CATCHUP_LAG_MINUTES = 5 * 60;

async function exitCleanly(): Promise<never> {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(0);
}

async function main(): Promise<void> {
  logger.info('Daily job pipeline started');

  const forceRun = process.env.FORCE_RUN === 'true';
  const scheduleService = new NotificationScheduleService();
  const slot = scheduleService.getLatestDueSlot(env.timezone, [
    env.jobRunTime1,
    env.jobRunTime2,
  ]);

  await connectRedis();

  if (!redisClient.isOpen) {
    throw new Error('Redis is not connected. Check REDIS_URL secret.');
  }

  /*
   * Each notification slot (09:00 / 21:00 in the configured timezone) is sent
   * once. Manual/dispatch runs always go through and mark the slot as sent;
   * scheduled runs only run if the latest due slot has not been sent yet and
   * is not older than MAX_CATCHUP_LAG_MINUTES.
   */
  const slotKey = slot ? `${SLOT_KEY_PREFIX}${slot.key}` : null;
  let claimed = false;

  if (slot && slotKey) {
    if (forceRun) {
      await redisClient.set(slotKey, 'forced', { EX: SLOT_TTL_SECONDS });
      claimed = true;
    } else if (slot.lagMinutes > MAX_CATCHUP_LAG_MINUTES) {
      logger.info(
        `Latest slot ${slot.key} is ${slot.lagMinutes} min old (> ${MAX_CATCHUP_LAG_MINUTES}); skipping this trigger.`,
      );
      await exitCleanly();
    } else {
      const reply = await redisClient.set(slotKey, 'scheduled', {
        NX: true,
        EX: SLOT_TTL_SECONDS,
      });

      if (reply !== 'OK') {
        logger.info(`Slot ${slot.key} was already sent; skipping this trigger.`);
        await exitCleanly();
      }

      claimed = true;
      logger.info(`Running slot ${slot.key} (${slot.lagMinutes} min after its time).`);
    }
  }

  let result;

  try {
    result = await jobPipelineService.run();
  } catch (error) {
    // Release the slot so the next trigger can retry it.
    if (claimed && slotKey) {
      await redisClient.del(slotKey).catch(() => undefined);
    }
    throw error;
  }

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
