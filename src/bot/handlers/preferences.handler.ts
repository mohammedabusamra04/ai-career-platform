import type { Bot } from 'grammy';

import type { BotContext } from '../context.js';

import { confirmationKeyboard } from '../keyboards/confirmation.keyboard.js';
import { experienceKeyboard } from '../keyboards/experience.keyboard.js';
import { workTypeKeyboard } from '../keyboards/work-type.keyboard.js';

import {
  isValidExperienceLevel,
  isValidWorkType,
  normalizeJobTitle,
  normalizeLocation,
  normalizeSkills,
  validateJobTitle,
} from '../../modules/preferences/preference.validator.js';

export function registerPreferencesHandler(bot: Bot<BotContext>): void {
  bot.on('message:text', async (ctx) => {
    switch (ctx.session.step) {
      case 'job-title': {
        const jobTitle = normalizeJobTitle(ctx.message.text);

        if (!validateJobTitle(jobTitle)) {
          await ctx.reply('❌ Please enter a valid job title (2-100 characters).');

          return;
        }

        ctx.session.preferences.jobTitle = jobTitle;
        ctx.session.step = 'work-type';

        await ctx.reply('Great! 👍\n\nWhat type of work do you prefer?', {
          reply_markup: workTypeKeyboard,
        });

        return;
      }

      case 'location': {
        const location = normalizeLocation(ctx.message.text);

        ctx.session.preferences.location = location;
        ctx.session.step = 'skills';

        await ctx.reply(
          '📍 Location saved.\n\n' +
            'What are your relevant skills?\n\n' +
            'Example: Node.js, TypeScript, PostgreSQL, Redis',
        );

        return;
      }

      case 'skills': {
        const skills = normalizeSkills(ctx.message.text);

        if (skills.length === 0) {
          await ctx.reply(
            '❌ Please enter at least one skill.\n\n' + 'Example: Node.js, TypeScript, PostgreSQL',
          );

          return;
        }

        ctx.session.preferences.skills = skills;
        ctx.session.step = 'confirmation';

        const { jobTitle, workType, experienceLevel, location } = ctx.session.preferences;

        await ctx.reply(
          '📋 Please review your preferences:\n\n' +
            `💼 Job Title: ${jobTitle}\n` +
            `🏢 Work Type: ${workType}\n` +
            `📈 Experience Level: ${experienceLevel}\n` +
            `📍 Location: ${location ?? 'Any'}\n` +
            `🛠 Skills: ${skills.join(', ')}`,
          {
            reply_markup: confirmationKeyboard,
          },
        );

        return;
      }

      default:
        return;
    }
  });

  bot.callbackQuery(/^work-type:(.+)$/, async (ctx) => {
    if (ctx.session.step !== 'work-type') {
      await ctx.answerCallbackQuery();

      return;
    }

    const workType = ctx.match[1];

    if (!isValidWorkType(workType)) {
      await ctx.answerCallbackQuery({
        text: '❌ Invalid work type.',
        show_alert: true,
      });

      return;
    }

    ctx.session.preferences.workType = workType;
    ctx.session.step = 'experience-level';

    await ctx.answerCallbackQuery();

    await ctx.reply(`Work type selected: ${workType}\n\n` + 'What is your experience level?', {
      reply_markup: experienceKeyboard,
    });
  });

  bot.callbackQuery(/^experience:(.+)$/, async (ctx) => {
    if (ctx.session.step !== 'experience-level') {
      await ctx.answerCallbackQuery();

      return;
    }

    const experienceLevel = ctx.match[1];

    if (!isValidExperienceLevel(experienceLevel)) {
      await ctx.answerCallbackQuery({
        text: '❌ Invalid experience level.',
        show_alert: true,
      });

      return;
    }

    ctx.session.preferences.experienceLevel = experienceLevel;
    ctx.session.step = 'location';

    await ctx.answerCallbackQuery();

    await ctx.reply(
      `Experience level selected: ${experienceLevel}\n\n` +
        'What is your preferred location?\n\n' +
        'You can type a location or "any".',
    );
  });

  bot.callbackQuery('preferences:confirm', async (ctx) => {
    if (ctx.session.step !== 'confirmation') {
      await ctx.answerCallbackQuery();

      return;
    }

    await ctx.answerCallbackQuery();

    await ctx.reply('✅ Your job preferences have been saved successfully!');
  });

  bot.callbackQuery('preferences:restart', async (ctx) => {
    ctx.session = {
      step: 'job-title',
      preferences: {},
    };

    await ctx.answerCallbackQuery();

    await ctx.reply("🔄 Let's start again.\n\n" + 'What job are you looking for?');
  });

  bot.callbackQuery('preferences:update', async (ctx) => {
    ctx.session.step = 'job-title';

    await ctx.answerCallbackQuery();

    await ctx.reply("✏️ Let's update your preferences.\n\n" + 'What job are you looking for?');
  });
}
