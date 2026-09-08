import { describe, expect, it, vi } from 'vitest';
import type { Bot } from 'grammy';
import { registerStartHandler } from './start.handler.js';
import type { BotContext } from '../context.js';

describe('registerStartHandler', () => {
  it('should register /start command and initialize user session', async () => {
    let commandHandler: ((ctx: unknown) => Promise<void>) | undefined;

    const mockBot = {
      command: vi.fn((cmd: string, handler: (ctx: unknown) => Promise<void>) => {
        if (cmd === 'start') {
          commandHandler = handler;
        }
      }),
    };

    registerStartHandler(mockBot as unknown as Bot<BotContext>);

    expect(mockBot.command).toHaveBeenCalledWith('start', expect.any(Function));

    const mockCtx = {
      session: undefined as unknown,
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await commandHandler!(mockCtx);

    expect(mockCtx.session).toEqual({
      step: 'job-title',
      preferences: {},
    });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Welcome to AI Career Bot!'),
    );
  });
});
