import type { RedisClientType } from 'redis';

import type { SubscriptionStore } from './subscription.store.interface.js';

export class RedisSubscriptionStore implements SubscriptionStore {
  private readonly key = 'subscribers';

  constructor(private readonly client: RedisClientType) {}

  async add(userId: number): Promise<void> {
    await this.client.sAdd(this.key, userId.toString());
  }

  async remove(userId: number): Promise<void> {
    await this.client.sRem(this.key, userId.toString());
  }

  async has(userId: number): Promise<boolean> {
    const userIds = await this.client.sMembers(this.key);

    return userIds.includes(userId.toString());
  }

  async getAll(): Promise<number[]> {
    const userIds = await this.client.sMembers(this.key);

    return userIds.map(Number);
  }
}
