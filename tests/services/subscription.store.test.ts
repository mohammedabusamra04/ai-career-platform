import { describe, expect, it, vi } from 'vitest';
import type { RedisClientType } from 'redis';
import { RedisSubscriptionStore } from '../../src/modules/subscriptions/subscription.store.js';

describe('RedisSubscriptionStore', () => {
  const createMockRedis = () =>
    ({
      sAdd: vi.fn(),
      sRem: vi.fn(),
      sMembers: vi.fn(),
    }) as unknown as RedisClientType;

  it('should add subscriber to Redis set', async () => {
    const redis = createMockRedis();
    const store = new RedisSubscriptionStore(redis);

    await store.add(123);

    expect(redis.sAdd).toHaveBeenCalledWith('subscribers', '123');
  });

  it('should remove subscriber from Redis set', async () => {
    const redis = createMockRedis();
    const store = new RedisSubscriptionStore(redis);

    await store.remove(123);

    expect(redis.sRem).toHaveBeenCalledWith('subscribers', '123');
  });

  it('should check if subscriber exists', async () => {
    const redis = createMockRedis();
    vi.mocked(redis.sMembers).mockResolvedValue(['123', '456']);
    const store = new RedisSubscriptionStore(redis);

    expect(await store.has(123)).toBe(true);
    expect(await store.has(999)).toBe(false);
  });

  it('should return all subscriber IDs as numbers', async () => {
    const redis = createMockRedis();
    vi.mocked(redis.sMembers).mockResolvedValue(['123', '456']);
    const store = new RedisSubscriptionStore(redis);

    expect(await store.getAll()).toEqual([123, 456]);
  });
});
