import { Bot } from 'grammy';

import env from '../config/env.js';

import { registerPreferencesHandler } from './handlers/preferences.handler.js';
import { registerStartHandler } from './handlers/start.handler.js';
import { deduplicateMiddleware } from './middleware/deduplicate.middleware.js';
import logger from '../shared/utils/logger.js';

if (!env.telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is not configured');
}

console.log('CREATING BOT INSTANCE');

export const bot = new Bot(env.telegramBotToken);

// Apply deduplication middleware as the first step
bot.use(deduplicateMiddleware);

registerStartHandler(bot);

registerPreferencesHandler(bot);

bot.catch((error) => {
  logger.error(`Telegram bot error: ${error.message}`);
});
