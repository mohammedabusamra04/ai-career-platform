import { describe, expect, it, vi } from 'vitest';

import { RedisSubscriptionStore } from './subscription.store.js';

type RedisClientMock = {
  sAdd: ReturnType<typeof vi.fn>;
  sRem: ReturnType<typeof vi.fn>;
  sMembers: ReturnType<typeof vi.fn>;
};

describe('RedisSubscriptionStore', () => {
  const createStore = () => {
    const client: RedisClientMock = {
      sAdd: vi.fn(),
      sRem: vi.fn(),
      sMembers: vi.fn(),
    };

    return {
      store: new RedisSubscriptionStore(
        client as unknown as ConstructorParameters<typeof RedisSubscriptionStore>[0],
      ),
      client,
    };
  };

  it('should add a user to subscribers', async () => {
    const { store, client } = createStore();

    await store.add(123);

    expect(client.sAdd).toHaveBeenCalledWith('subscribers', '123');
  });

  it('should remove a user from subscribers', async () => {
    const { store, client } = createStore();

    await store.remove(123);

    expect(client.sRem).toHaveBeenCalledWith('subscribers', '123');
  });

  it('should return true when user is subscribed', async () => {
    const { store, client } = createStore();

    vi.mocked(client.sMembers).mockResolvedValue(['123', '456']);

    const result = await store.has(123);

    expect(result).toBe(true);
  });

  it('should return false when user is not subscribed', async () => {
    const { store, client } = createStore();

    vi.mocked(client.sMembers).mockResolvedValue(['456']);

    const result = await store.has(123);

    expect(result).toBe(false);
  });

  it('should return all subscribed users', async () => {
    const { store, client } = createStore();

    vi.mocked(client.sMembers).mockResolvedValue(['123', '456', '789']);

    const result = await store.getAll();

    expect(result).toEqual([123, 456, 789]);
  });
});
