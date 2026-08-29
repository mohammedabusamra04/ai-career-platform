import type { Bot } from 'grammy';

import type { BotContext } from '../context.js';

export function registerStartHandler(bot: Bot<BotContext>): void {
  bot.command('start', async (ctx) => {
    ctx.session = {
      step: 'job-title',
      preferences: {},
    };

    await ctx.reply(
      '👋 Welcome to AI Career Bot!\n\n' +
        "Let's configure your job preferences.\n\n" +
        'What job are you looking for?',
    );
  });
}
