import type { Bot } from 'grammy';
import { experienceKeyboard } from '../keyboards/experience.keyboard.js';

export function registerPreferencesHandler(bot: Bot): void {
  bot.callbackQuery(/^work_/, async (ctx) => {
    const workType = ctx.callbackQuery.data.replace('work_', '');

    await ctx.answerCallbackQuery();

    await ctx.reply(`Work type selected: ${workType}\n\n` + 'What is your experience level?', {
      reply_markup: experienceKeyboard,
    });
  });

  bot.callbackQuery(/^experience_/, async (ctx) => {
    const experience = ctx.callbackQuery.data.replace('experience_', '');

    await ctx.answerCallbackQuery();

    await ctx.reply(
      `Experience level selected: ${experience}.\n\n` +
        'Your preferences have been collected successfully! ✅',
    );
  });

  bot.on('message:text', async (ctx) => {
    await ctx.reply(
      'Please use the buttons provided to select your preferences.\n\n' +
        'You can also send /start to restart the onboarding.',
    );
  });
}
