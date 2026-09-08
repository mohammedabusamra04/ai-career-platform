import type { Cache } from '../../cache/cache.interface.js';
import { cacheKeys } from '../../cache/cache.keys.js';
import { CACHE_TTL } from '../../cache/cache.ttl.js';
import logger from '../../shared/utils/logger.js';

import type { Job, JobSearchQuery } from './job.types.js';
import type { MatchedJob } from '../matching/matching.service.js';
import type { UserPreferences } from '../preferences/preference.types.js';

interface JobCollector {
  collectJobs(query: JobSearchQuery): Promise<Job[]>;
}

interface JobDeduplicator {
  deduplicate(jobs: Job[]): Promise<{
    uniqueJobs: Job[];
    duplicateJobs: Job[];
  }>;
}

interface JobFingerprinter {
  generate(job: Job): string;
}

interface SubscriptionReader {
  getSubscribedUsers(): Promise<number[]>;
  isSubscribed(userId: number): Promise<boolean>;
}

interface PreferenceReader {
  getPreferences(userId: number): Promise<UserPreferences | null>;
}

interface JobMatcher {
  matchJobs(jobs: Job[], preferences: UserPreferences): Promise<MatchedJob[]>;
}

interface JobNotifier {
  sendJobs(chatId: number, matchedJobs: MatchedJob[]): Promise<void>;
}

const MINIMUM_MATCH_SCORE = 60;

export class JobPipelineService {
  constructor(
    private readonly jobCollectionService: JobCollector,
    private readonly deduplicationService: JobDeduplicator,
    private readonly fingerprintService: JobFingerprinter,
    private readonly cache: Cache,
    private readonly subscriptionService: SubscriptionReader,
    private readonly preferenceService: PreferenceReader,
    private readonly matchingService: JobMatcher,
    private readonly notificationService: JobNotifier,
  ) {}

  async run(): Promise<void> {
    const subscribers = await this.subscriptionService.getSubscribedUsers();
    logger.info(`Job pipeline started. Found ${subscribers.length} subscribed users.`);

    for (const userId of subscribers) {
      await this.runForUser(userId);
    }
  }

  async runForUser(userId: number): Promise<void> {
    try {
      const isSubscribed = await this.subscriptionService.isSubscribed(userId);

      if (!isSubscribed) {
        logger.info(`User ${userId} is not subscribed. Skipping.`);
        return;
      }

      const preferences = await this.preferenceService.getPreferences(userId);

      if (!preferences) {
        logger.info(`User ${userId} has no saved preferences. Skipping.`);
        return;
      }

      const jobs = await this.jobCollectionService.collectJobs({
        jobTitle: preferences.jobTitle,
        workType: preferences.workType,
        experienceLevel: preferences.experienceLevel,
        location: preferences.location,
        skills: preferences.skills,
      });

      if (jobs.length === 0) {
        logger.info(`No jobs collected for user ${userId}. Sending no-match notification.`);
        await this.notificationService.sendJobs(userId, []);
        return;
      }

      const { uniqueJobs } = await this.deduplicationService.deduplicate(jobs);

      if (uniqueJobs.length === 0) {
        logger.info(
          `All ${jobs.length} collected jobs are duplicates for user ${userId}. Sending no-match notification.`,
        );
        await this.notificationService.sendJobs(userId, []);
        return;
      }

      await this.cacheJobs(uniqueJobs);

      const matchedJobs = await this.matchingService.matchJobs(uniqueJobs, preferences);

      const qualityMatches = matchedJobs.filter(
        (matchedJob) => matchedJob.score >= MINIMUM_MATCH_SCORE,
      );

      if (qualityMatches.length === 0) {
        logger.info(
          `No matches met the minimum score (${MINIMUM_MATCH_SCORE}) for user ${userId}. Sending no-match notification.`,
        );
        await this.notificationService.sendJobs(userId, []);
        return;
      }

      logger.info(`Sending ${qualityMatches.length} matched jobs to user ${userId}.`);
      await this.notificationService.sendJobs(userId, qualityMatches);
    } catch (error) {
      console.error(`Failed to process job pipeline for user ${userId}:`, error);
    }
  }

  private async cacheJobs(jobs: Job[]): Promise<void> {
    for (const job of jobs) {
      const fingerprint = this.fingerprintService.generate(job);

      await this.cache.set(cacheKeys.job(fingerprint), job, CACHE_TTL.JOB);
    }
  }
}
