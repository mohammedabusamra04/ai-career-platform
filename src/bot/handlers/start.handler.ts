import type { Bot } from 'grammy';
import { workTypeKeyboard } from '../keyboards/work-type.keyboard.js';

export function registerStartHandler(bot: Bot): void {
  bot.command('start', async (ctx) => {
    console.log('START HANDLER CALLED:', {
      userId: ctx.from?.id,
      updateId: ctx.update.update_id,
      messageId: ctx.message?.message_id,
      date: ctx.message?.date,
      localTime: new Date().toISOString(),
      fullUpdate: JSON.stringify(ctx.update, null, 2),
    });

    await ctx.reply(
      '👋 Welcome to AI Career Bot!\n\n' +
        "Let's set up your job preferences.\n\n" +
        'What type of work do you prefer?',
      {
        reply_markup: workTypeKeyboard,
      },
    );
  });
}
