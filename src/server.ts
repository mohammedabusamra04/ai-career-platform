import app from './app.js';
import { bot } from './bot/bot.js';
import { connectRedis } from './config/redis.js';
import env from './config/env.js';
import { jobNotificationScheduler } from './config/services.js';
import logger from './shared/utils/logger.js';

app.listen(env.port, () => {
  logger.info(`App is running on port ${env.port}`);
});

await connectRedis();

jobNotificationScheduler.start();

bot
  .start({
    drop_pending_updates: true,
  })
  .catch((error) => {
    logger.error(`Failed to start Telegram bot: ${error.message}`);
  });
