import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerSubscriptionHandler } from './subscription.handler.js';
import { subscriptionService } from '../../modules/subscriptions/subscription.service.js';

vi.mock('../../modules/subscriptions/subscription.service.js', () => ({
  subscriptionService: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    isSubscribed: vi.fn(),
  },
}));

describe('SubscriptionHandler', () => {
  const commandHandlers = new Map<string, (ctx: TestContext) => Promise<void>>();

  const bot = {
    command: vi.fn((command: string, handler: (ctx: TestContext) => Promise<void>) => {
      commandHandlers.set(command, handler);
    }),
  };

  type TestContext = {
    from?: {
      id: number;
    };
    reply: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    commandHandlers.clear();

    registerSubscriptionHandler(bot as never);
  });

  it('should subscribe the user', async () => {
    const ctx: TestContext = {
      from: { id: 123 },
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('subscribe');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.subscribe).toHaveBeenCalledWith(123);
    expect(ctx.reply).toHaveBeenCalledWith(
      '✅ You are now subscribed to job alerts.\n\n' +
        'You will receive matched job opportunities automatically.',
    );
  });

  it('should unsubscribe the user', async () => {
    const ctx: TestContext = {
      from: { id: 123 },
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('unsubscribe');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.unsubscribe).toHaveBeenCalledWith(123);
    expect(ctx.reply).toHaveBeenCalledWith(
      '🔕 You have been unsubscribed from job alerts.\n\n' +
        'You will no longer receive automated job notifications.',
    );
  });

  it('should show subscribed status', async () => {
    vi.mocked(subscriptionService.isSubscribed).mockResolvedValue(true);

    const ctx: TestContext = {
      from: { id: 123 },
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('subscription');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.isSubscribed).toHaveBeenCalledWith(123);
    expect(ctx.reply).toHaveBeenCalledWith(
      '🔔 You are currently subscribed to job alerts.\n\n' +
        'Use /unsubscribe to stop receiving notifications.',
    );
  });

  it('should show unsubscribed status', async () => {
    vi.mocked(subscriptionService.isSubscribed).mockResolvedValue(false);

    const ctx: TestContext = {
      from: { id: 123 },
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('subscription');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.isSubscribed).toHaveBeenCalledWith(123);
    expect(ctx.reply).toHaveBeenCalledWith(
      '🔕 You are currently unsubscribed from job alerts.\n\n' +
        'Use /subscribe to start receiving notifications.',
    );
  });

  it('should handle missing user id when subscribing', async () => {
    const ctx: TestContext = {
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('subscribe');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.subscribe).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('❌ Unable to identify your Telegram account.');
  });

  it('should handle missing user id when unsubscribing', async () => {
    const ctx: TestContext = {
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('unsubscribe');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.unsubscribe).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('❌ Unable to identify your Telegram account.');
  });

  it('should handle missing user id when checking status', async () => {
    const ctx: TestContext = {
      reply: vi.fn(),
    };

    const handler = commandHandlers.get('subscription');

    expect(handler).toBeDefined();

    await handler!(ctx);

    expect(subscriptionService.isSubscribed).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('❌ Unable to identify your Telegram account.');
  });

  it('should register all subscription commands', () => {
    expect(bot.command).toHaveBeenCalledTimes(3);
    expect(commandHandlers.has('subscribe')).toBe(true);
    expect(commandHandlers.has('unsubscribe')).toBe(true);
    expect(commandHandlers.has('subscription')).toBe(true);
  });
});
