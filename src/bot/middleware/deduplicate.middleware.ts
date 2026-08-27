import type { Middleware } from 'grammy';
import logger from '../../shared/utils/logger.js';

const processedKeys = new Set<string>();

export const deduplicateMiddleware: Middleware = async (ctx, next) => {
  let key: string | null = null;

  if (ctx.message) {
    key = `msg:${ctx.chat?.id}:${ctx.message.message_id}`;
  } else if (ctx.callbackQuery) {
    key = `cb:${ctx.chat?.id}:${ctx.callbackQuery.message?.message_id}:${ctx.callbackQuery.data}`;
  }

  if (key) {
    if (processedKeys.has(key)) {
      logger.warn(`[DEDUPLICATE] Dropping duplicate update for key: ${key}`);
      return;
    }

    processedKeys.add(key);

    // Keep the key in memory for 10 seconds to cover all retry/duplicate windows
    setTimeout(() => {
      processedKeys.delete(key!);
    }, 10000);
  }

  await next();
};
