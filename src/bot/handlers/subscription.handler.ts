import type { Bot } from 'grammy';

import type { BotContext } from '../context.js';
import { subscriptionService } from '../../modules/subscriptions/subscription.service.js';

export function registerSubscriptionHandler(bot: Bot<BotContext>): void {
  bot.command('subscribe', async (ctx) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('❌ Unable to identify your Telegram account.');
      return;
    }

    await subscriptionService.subscribe(userId);

    await ctx.reply(
      '✅ You are now subscribed to job alerts.\n\n' +
        'You will receive matched job opportunities automatically.',
    );
  });

  bot.command('unsubscribe', async (ctx) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('❌ Unable to identify your Telegram account.');
      return;
    }

    await subscriptionService.unsubscribe(userId);

    await ctx.reply(
      '🔕 You have been unsubscribed from job alerts.\n\n' +
        'You will no longer receive automated job notifications.',
    );
  });

  const handleSubscriptionStatus = async (ctx: BotContext) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('❌ Unable to identify your Telegram account.');
      return;
    }

    const isSubscribed = await subscriptionService.isSubscribed(userId);

    if (isSubscribed) {
      await ctx.reply(
        '🔔 You are currently subscribed to job alerts.\n\n' +
          'Use /unsubscribe to stop receiving notifications.',
      );

      return;
    }

    await ctx.reply(
      '🔕 You are currently unsubscribed from job alerts.\n\n' +
        'Use /subscribe to start receiving notifications.',
    );
  };

  bot.command('subscription', handleSubscriptionStatus);

  if (typeof bot.hears === 'function') {
    bot.hears(
      ['🔔 Subscription Status', 'Subscription Status', 'Subscription'],
      handleSubscriptionStatus,
    );
  }
}

