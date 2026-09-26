import type { Bot } from 'grammy';

import type { BotContext } from '../context.js';
import { startReplyKeyboard } from '../keyboards/main.keyboard.js';

export function registerStartHandler(bot: Bot<BotContext>): void {
  const handleStart = async (ctx: BotContext) => {
    ctx.session = {
      step: 'job-title',
      preferences: {},
    };

    await ctx.reply(
      '👋 Welcome to AI Career Bot!\n\n' +
        "Let's configure your job preferences.\n\n" +
        'What job are you looking for?',
      {
        reply_markup: startReplyKeyboard,
      },
    );
  };

  bot.command('start', handleStart);

  if (typeof bot.hears === 'function') {
    bot.hears(['🚀 Start Job Search', 'Start Job Search', 'Start', '/start'], handleStart);
  }


  if (typeof bot.callbackQuery === 'function') {
    bot.callbackQuery('start_search', async (ctx) => {
      await ctx.answerCallbackQuery();
      await handleStart(ctx);
    });
  }
}

