import redisClient from './redis.js';

import { RedisAdapter } from '../cache/redis.adapter.js';

import { JobCollectionService } from '../modules/jobs/job.collection.service.js';

import { JobPipelineService } from '../modules/jobs/job.pipeline.service.js';

import env from './env.js';

import {
  JobSourceManager,
  RemotiveJobSource,
  WeWorkRemotelyJobSource,
  MostaqlJobSource,
  BaytJobSource,
  LinkedinJobSource,
} from '../modules/jobs/sources/index.js';
import type { JobSource } from '../modules/jobs/sources/job-source.interface.js';

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

const activeJobSources: JobSource[] = [
  new RemotiveJobSource(),
  new WeWorkRemotelyJobSource(),
  new MostaqlJobSource(),
  new BaytJobSource(),
  ...(env.rapidApiKey ? [new LinkedinJobSource(env.rapidApiKey)] : []),
];

const jobSourceManager = new JobSourceManager(activeJobSources);

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
