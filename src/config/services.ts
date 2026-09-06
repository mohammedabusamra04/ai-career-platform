import redisClient from './redis.js';

import { RedisAdapter } from '../cache/redis.adapter.js';

import { JobCollectionService } from '../modules/jobs/job.collection.service.js';

import { JobPipelineService } from '../modules/jobs/job.pipeline.service.js';

import { JobSourceManager } from '../modules/jobs/sources/job-source.manager.js';

import { DeduplicationService } from '../modules/deduplication/deduplication.service.js';

import { FingerprintService } from '../modules/deduplication/fingerprint.service.js';

import { GeminiProvider } from '../modules/matching/ai/gemini.provider.js';

import { MatchingService } from '../modules/matching/matching.service.js';

import { JobNotificationScheduler } from '../modules/notifications/job-notification.scheduler.js';

import { NotificationScheduleService } from '../modules/notifications/notification.schedule.js';

import { TelegramNotificationService } from '../modules/notifications/telegram/telegram-notification.service.js';

import { preferenceService } from '../modules/preferences/preference.service.js';

import { subscriptionService } from '../modules/subscriptions/subscription.service.js';

import { bot } from '../bot/bot.js';

const cache = new RedisAdapter(redisClient);

const jobSourceManager = new JobSourceManager([]);

export const jobCollectionService = new JobCollectionService(jobSourceManager);

const fingerprintService = new FingerprintService();

const deduplicationService = new DeduplicationService(fingerprintService, cache);

const aiProvider = new GeminiProvider();

const matchingService = new MatchingService(aiProvider);

const telegramNotificationService = new TelegramNotificationService(bot.api);

export const jobPipelineService = new JobPipelineService(
  jobCollectionService,
  deduplicationService,
  fingerprintService,
  cache,
  subscriptionService,
  preferenceService,
  matchingService,
  telegramNotificationService,
);

const notificationScheduleService = new NotificationScheduleService();

export const jobNotificationScheduler = new JobNotificationScheduler(
  jobPipelineService,
  notificationScheduleService,
  subscriptionService,
  preferenceService,
);
