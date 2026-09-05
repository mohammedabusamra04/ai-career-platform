import { describe, expect, it, vi } from 'vitest';

import { SubscriptionService } from './subscription.service.js';

import type { SubscriptionStore } from './subscription.store.interface.js';

describe('SubscriptionService', () => {
  const createService = () => {
    const store: SubscriptionStore = {
      add: vi.fn(),
      remove: vi.fn(),
      has: vi.fn(),
      getAll: vi.fn(),
    };

    return {
      service: new SubscriptionService(store),
      store,
    };
  };

  it('should subscribe a user', async () => {
    const { service, store } = createService();

    await service.subscribe(123);

    expect(store.add).toHaveBeenCalledWith(123);
  });

  it('should unsubscribe a user', async () => {
    const { service, store } = createService();

    await service.unsubscribe(123);

    expect(store.remove).toHaveBeenCalledWith(123);
  });

  it('should return true when user is subscribed', async () => {
    const { service, store } = createService();

    vi.mocked(store.has).mockResolvedValue(true);

    const result = await service.isSubscribed(123);

    expect(result).toBe(true);
    expect(store.has).toHaveBeenCalledWith(123);
  });

  it('should return false when user is not subscribed', async () => {
    const { service, store } = createService();

    vi.mocked(store.has).mockResolvedValue(false);

    const result = await service.isSubscribed(123);

    expect(result).toBe(false);
  });

  it('should return all subscribed users', async () => {
    const { service, store } = createService();

    vi.mocked(store.getAll).mockResolvedValue([123, 456, 789]);

    const result = await service.getSubscribedUsers();

    expect(result).toEqual([123, 456, 789]);
    expect(store.getAll).toHaveBeenCalled();
  });
});
