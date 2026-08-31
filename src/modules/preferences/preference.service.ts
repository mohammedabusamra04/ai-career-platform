import ms from 'ms';

import redisClient from '../../config/redis.js';
import { RedisAdapter } from '../../cache/redis.adapter.js';
import type { Cache } from '../../cache/cache.interface.js';

import { AppError } from '../../shared/errors/AppError.js';

import type { ExperienceLevel, UserPreferences, WorkType } from './preference.types.js';

import {
  isValidExperienceLevel,
  isValidWorkType,
  normalizeJobTitle,
  normalizeLocation,
  normalizeSkills,
  validateJobTitle,
} from './preference.validator.js';

const PREFERENCES_TTL = ms('24h') / 1000;

export class PreferenceService {
  constructor(private readonly cache: Cache) {}

  private getKey(userId: number): string {
    return `preferences:${userId}`;
  }

  createPreferences(input: {
    jobTitle: string;
    workType: string;
    experienceLevel: string;
    location?: string;
    skills?: string;
  }): UserPreferences {
    const jobTitle = normalizeJobTitle(input.jobTitle);

    if (!validateJobTitle(jobTitle)) {
      throw AppError.badRequest('Invalid job title');
    }

    if (!isValidWorkType(input.workType)) {
      throw AppError.badRequest('Invalid work type');
    }

    if (!isValidExperienceLevel(input.experienceLevel)) {
      throw AppError.badRequest('Invalid experience level');
    }

    return {
      jobTitle,
      workType: input.workType as WorkType,
      experienceLevel: input.experienceLevel as ExperienceLevel,
      location: input.location ? normalizeLocation(input.location) : undefined,
      skills: input.skills ? normalizeSkills(input.skills) : undefined,
    };
  }

  async savePreferences(userId: number, preferences: UserPreferences): Promise<void> {
    await this.cache.set(this.getKey(userId), preferences, PREFERENCES_TTL);
  }

  async getPreferences(userId: number): Promise<UserPreferences | null> {
    return this.cache.get<UserPreferences>(this.getKey(userId));
  }

  async updatePreferences(userId: number, preferences: Partial<UserPreferences>): Promise<void> {
    const existing = await this.getPreferences(userId);

    if (!existing) {
      throw AppError.notFound('User preferences not found');
    }

    const updatedPreferences: UserPreferences = {
      ...existing,
      ...preferences,
    };

    await this.cache.set(this.getKey(userId), updatedPreferences, PREFERENCES_TTL);
  }

  async deletePreferences(userId: number): Promise<void> {
    await this.cache.delete(this.getKey(userId));
  }
}

const cache = new RedisAdapter(redisClient);

export const preferenceService = new PreferenceService(cache);
