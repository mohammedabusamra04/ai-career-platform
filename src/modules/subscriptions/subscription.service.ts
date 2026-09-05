import redisClient from '../../config/redis.js';

import type { SubscriptionStore } from './subscription.store.interface.js';
import { RedisSubscriptionStore } from './subscription.store.js';

export class SubscriptionService {
  constructor(private readonly store: SubscriptionStore) {}

  async subscribe(userId: number): Promise<void> {
    await this.store.add(userId);
  }

  async unsubscribe(userId: number): Promise<void> {
    await this.store.remove(userId);
  }

  async isSubscribed(userId: number): Promise<boolean> {
    return this.store.has(userId);
  }

  async getSubscribedUsers(): Promise<number[]> {
    return this.store.getAll();
  }
}

const store = new RedisSubscriptionStore(redisClient);

export const subscriptionService = new SubscriptionService(store);
