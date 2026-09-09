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

export interface PipelineRunResult {
  subscribers: number;
  processed: number;
  notifiedWithJobs: number;
  notifiedNoMatch: number;
  skippedNoPreferences: number;
  errors: number;
}

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

  async run(): Promise<PipelineRunResult> {
    const subscribers = await this.subscriptionService.getSubscribedUsers();
    logger.info(`Job pipeline started. Found ${subscribers.length} subscribed users.`);

    const result: PipelineRunResult = {
      subscribers: subscribers.length,
      processed: 0,
      notifiedWithJobs: 0,
      notifiedNoMatch: 0,
      skippedNoPreferences: 0,
      errors: 0,
    };

    for (const userId of subscribers) {
      const outcome = await this.runForUser(userId);
      result.processed += 1;

      if (outcome === 'sent_jobs') {
        result.notifiedWithJobs += 1;
      } else if (outcome === 'no_match') {
        result.notifiedNoMatch += 1;
      } else if (outcome === 'skipped_no_preferences') {
        result.skippedNoPreferences += 1;
      } else if (outcome === 'error') {
        result.errors += 1;
      }
    }

    logger.info(
      `Job pipeline finished. subscribers=${result.subscribers}, withJobs=${result.notifiedWithJobs}, noMatch=${result.notifiedNoMatch}, skippedNoPrefs=${result.skippedNoPreferences}, errors=${result.errors}`,
    );

    return result;
  }

  async runForUser(
    userId: number,
  ): Promise<'sent_jobs' | 'no_match' | 'skipped_no_preferences' | 'skipped' | 'error'> {
    try {
      const isSubscribed = await this.subscriptionService.isSubscribed(userId);

      if (!isSubscribed) {
        logger.info(`User ${userId} is not subscribed. Skipping.`);
        return 'skipped';
      }

      const preferences = await this.preferenceService.getPreferences(userId);

      if (!preferences) {
        logger.info(`User ${userId} has no saved preferences. Skipping.`);
        return 'skipped_no_preferences';
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
        return 'no_match';
      }

      const { uniqueJobs } = await this.deduplicationService.deduplicate(jobs);

      if (uniqueJobs.length === 0) {
        logger.info(
          `All ${jobs.length} collected jobs are duplicates for user ${userId}. Sending no-match notification.`,
        );
        await this.notificationService.sendJobs(userId, []);
        return 'no_match';
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
        return 'no_match';
      }

      logger.info(`Sending ${qualityMatches.length} matched jobs to user ${userId}.`);
      await this.notificationService.sendJobs(userId, qualityMatches);
      return 'sent_jobs';
    } catch (error) {
      console.error(`Failed to process job pipeline for user ${userId}:`, error);
      return 'error';
    }
  }

  private async cacheJobs(jobs: Job[]): Promise<void> {
    for (const job of jobs) {
      const fingerprint = this.fingerprintService.generate(job);

      await this.cache.set(cacheKeys.job(fingerprint), job, CACHE_TTL.JOB);
    }
  }
}
