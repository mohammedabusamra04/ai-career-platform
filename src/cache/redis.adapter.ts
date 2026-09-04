import type { RedisClientType } from 'redis';

import type { Cache } from './cache.interface.js';

import logger from '../shared/utils/logger.js';

export class RedisAdapter implements Cache {
  constructor(private readonly client: RedisClientType) {}

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);

      if (ttl !== undefined) {
        await this.client.set(key, data, {
          EX: ttl,
        });

        return;
      }

      await this.client.set(key, data);
    } catch (error) {
      logger.error(
        `❌ Redis SET error for key "${key}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(
        `❌ Redis GET error for key "${key}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      throw error;
    }
  }
  async setIfNotExists<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const data = JSON.stringify(value);

      const result =
        ttl !== undefined
          ? await this.client.set(key, data, {
              NX: true,
              EX: ttl,
            })
          : await this.client.set(key, data, {
              NX: true,
            });

      return result === 'OK';
    } catch (error) {
      logger.error(
        `❌ Redis SET NX error for key "${key}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(
        `❌ Redis DELETE error for key "${key}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      throw error;
    }
  }
}
