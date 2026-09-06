import { describe, expect, it, vi } from 'vitest';

import { JobPipelineService } from './job.pipeline.service.js';
import type { Job } from './job.types.js';
import { JobSourceType } from './job.types.js';
import { WorkType, ExperienceLevel } from '../../shared/types/job.js';
import type { MatchedJob } from '../matching/matching.service.js';

describe('JobPipelineService', () => {
  const testJob: Job = {
    title: 'Backend Developer',
    company: 'Google',
    source: JobSourceType.LINKEDIN,
    applicationUrl: 'https://google.com/jobs/123',
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.JUNIOR,
    skills: ['Node.js', 'TypeScript'],
    publicationDate: new Date('2026-09-06T10:00:00.000Z'),
    scrapedAt: new Date('2026-09-06T10:00:00.000Z'),
  };

  const preferences = {
    jobTitle: 'Backend Developer',
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.JUNIOR,
    location: 'Gaza',
    skills: ['Node.js', 'TypeScript'],
    timezone: 'Asia/Gaza',
    notificationTimes: ['09:00'],
  };

  const createMocks = () => {
    const jobCollectionService = {
      collectJobs: vi.fn(),
    };

    const deduplicationService = {
      deduplicate: vi.fn(),
    };

    const fingerprintService = {
      generate: vi.fn(),
    };

    const cache = {
      set: vi.fn(),
      setIfNotExists: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };

    const subscriptionService = {
      getSubscribedUsers: vi.fn(),
      isSubscribed: vi.fn(),
    };

    const preferenceService = {
      getPreferences: vi.fn(),
    };

    const matchingService = {
      matchJobs: vi.fn(),
    };

    const notificationService = {
      sendJobs: vi.fn(),
    };

    const service = new JobPipelineService(
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      subscriptionService,
      preferenceService,
      matchingService,
      notificationService,
    );

    return {
      service,
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      subscriptionService,
      preferenceService,
      matchingService,
      notificationService,
    };
  };

  it('should process the complete job pipeline successfully', async () => {
    const {
      service,
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      subscriptionService,
      preferenceService,
      matchingService,
      notificationService,
    } = createMocks();

    const matchedJob: MatchedJob = {
      job: testJob,
      score: 80,
      reason: 'Strong match',
    };

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(preferences);
    jobCollectionService.collectJobs.mockResolvedValue([testJob]);

    deduplicationService.deduplicate.mockResolvedValue({
      uniqueJobs: [testJob],
      duplicateJobs: [],
    });

    fingerprintService.generate.mockReturnValue('test-fingerprint');
    cache.set.mockResolvedValue(undefined);

    matchingService.matchJobs.mockResolvedValue([matchedJob]);
    notificationService.sendJobs.mockResolvedValue(undefined);

    await service.runForUser(123);

    expect(subscriptionService.isSubscribed).toHaveBeenCalledWith(123);

    expect(preferenceService.getPreferences).toHaveBeenCalledWith(123);

    expect(jobCollectionService.collectJobs).toHaveBeenCalledWith({
      jobTitle: preferences.jobTitle,
      workType: preferences.workType,
      experienceLevel: preferences.experienceLevel,
      location: preferences.location,
      skills: preferences.skills,
    });

    expect(deduplicationService.deduplicate).toHaveBeenCalledWith([testJob]);

    expect(fingerprintService.generate).toHaveBeenCalledWith(testJob);

    expect(cache.set).toHaveBeenCalledWith('job:test-fingerprint', testJob, expect.any(Number));

    expect(matchingService.matchJobs).toHaveBeenCalledWith([testJob], preferences);

    expect(notificationService.sendJobs).toHaveBeenCalledWith(123, [matchedJob]);
  });

  it('should not process jobs when the user is not subscribed', async () => {
    const {
      preferenceService,
      jobCollectionService,
      deduplicationService,
      matchingService,
      notificationService,
    } = createMocks();

    const { subscriptionService } = createMocks();

    subscriptionService.isSubscribed.mockResolvedValue(false);

    const serviceWithMocks = new JobPipelineService(
      jobCollectionService,
      deduplicationService,
      {
        generate: vi.fn(),
      },
      {
        set: vi.fn(),
        setIfNotExists: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      },
      subscriptionService,
      preferenceService,
      matchingService,
      notificationService,
    );

    await serviceWithMocks.runForUser(123);

    expect(subscriptionService.isSubscribed).toHaveBeenCalledWith(123);
    expect(preferenceService.getPreferences).not.toHaveBeenCalled();
    expect(jobCollectionService.collectJobs).not.toHaveBeenCalled();
    expect(matchingService.matchJobs).not.toHaveBeenCalled();
    expect(notificationService.sendJobs).not.toHaveBeenCalled();
  });

  it('should not process jobs when user preferences do not exist', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      matchingService,
      notificationService,
    } = createMocks();

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(null);

    await service.runForUser(123);

    expect(preferenceService.getPreferences).toHaveBeenCalledWith(123);
    expect(jobCollectionService.collectJobs).not.toHaveBeenCalled();
    expect(matchingService.matchJobs).not.toHaveBeenCalled();
    expect(notificationService.sendJobs).not.toHaveBeenCalled();
  });

  it('should stop processing when no jobs are collected', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      deduplicationService,
      matchingService,
      notificationService,
    } = createMocks();

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(preferences);
    jobCollectionService.collectJobs.mockResolvedValue([]);

    await service.runForUser(123);

    expect(deduplicationService.deduplicate).not.toHaveBeenCalled();
    expect(matchingService.matchJobs).not.toHaveBeenCalled();
    expect(notificationService.sendJobs).not.toHaveBeenCalled();
  });

  it('should stop processing when all jobs are duplicates', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      deduplicationService,
      matchingService,
      notificationService,
    } = createMocks();

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(preferences);
    jobCollectionService.collectJobs.mockResolvedValue([testJob]);

    deduplicationService.deduplicate.mockResolvedValue({
      uniqueJobs: [],
      duplicateJobs: [testJob],
    });

    await service.runForUser(123);

    expect(deduplicationService.deduplicate).toHaveBeenCalledWith([testJob]);

    expect(matchingService.matchJobs).not.toHaveBeenCalled();
    expect(notificationService.sendJobs).not.toHaveBeenCalled();
  });

  it('should not notify when all matches are below the minimum score', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      matchingService,
      notificationService,
    } = createMocks();

    const lowScoreMatch: MatchedJob = {
      job: testJob,
      score: 40,
      reason: 'Weak match',
    };

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(preferences);
    jobCollectionService.collectJobs.mockResolvedValue([testJob]);

    deduplicationService.deduplicate.mockResolvedValue({
      uniqueJobs: [testJob],
      duplicateJobs: [],
    });

    fingerprintService.generate.mockReturnValue('test-fingerprint');
    cache.set.mockResolvedValue(undefined);

    matchingService.matchJobs.mockResolvedValue([lowScoreMatch]);

    await service.runForUser(123);

    expect(matchingService.matchJobs).toHaveBeenCalledWith([testJob], preferences);

    expect(notificationService.sendJobs).not.toHaveBeenCalled();
  });

  it('should notify only jobs that meet the minimum match score', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      matchingService,
      notificationService,
    } = createMocks();

    const lowScoreMatch: MatchedJob = {
      job: testJob,
      score: 40,
      reason: 'Weak match',
    };

    const highScoreMatch: MatchedJob = {
      job: testJob,
      score: 80,
      reason: 'Strong match',
    };

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(preferences);
    jobCollectionService.collectJobs.mockResolvedValue([testJob]);

    deduplicationService.deduplicate.mockResolvedValue({
      uniqueJobs: [testJob],
      duplicateJobs: [],
    });

    fingerprintService.generate.mockReturnValue('test-fingerprint');
    cache.set.mockResolvedValue(undefined);

    matchingService.matchJobs.mockResolvedValue([lowScoreMatch, highScoreMatch]);

    await service.runForUser(123);

    expect(notificationService.sendJobs).toHaveBeenCalledWith(123, [highScoreMatch]);
  });

  it('should continue processing other users when one user fails', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      matchingService,
      notificationService,
    } = createMocks();

    subscriptionService.getSubscribedUsers.mockResolvedValue([123, 456]);

    subscriptionService.isSubscribed.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    preferenceService.getPreferences
      .mockResolvedValueOnce(preferences)
      .mockRejectedValueOnce(new Error('Preference service failed'));

    jobCollectionService.collectJobs.mockResolvedValue([testJob]);

    deduplicationService.deduplicate.mockResolvedValue({
      uniqueJobs: [testJob],
      duplicateJobs: [],
    });

    fingerprintService.generate.mockReturnValue('test-fingerprint');
    cache.set.mockResolvedValue(undefined);

    matchingService.matchJobs.mockResolvedValue([
      {
        job: testJob,
        score: 80,
        reason: 'Strong match',
      },
    ]);

    await service.run();

    expect(preferenceService.getPreferences).toHaveBeenCalledTimes(2);
    expect(notificationService.sendJobs).toHaveBeenCalledTimes(1);
    expect(notificationService.sendJobs).toHaveBeenCalledWith(123, [
      {
        job: testJob,
        score: 80,
        reason: 'Strong match',
      },
    ]);
  });

  it('should not notify when there are no quality matches', async () => {
    const {
      service,
      subscriptionService,
      preferenceService,
      jobCollectionService,
      deduplicationService,
      fingerprintService,
      cache,
      matchingService,
      notificationService,
    } = createMocks();

    subscriptionService.isSubscribed.mockResolvedValue(true);
    preferenceService.getPreferences.mockResolvedValue(preferences);
    jobCollectionService.collectJobs.mockResolvedValue([testJob]);

    deduplicationService.deduplicate.mockResolvedValue({
      uniqueJobs: [testJob],
      duplicateJobs: [],
    });

    fingerprintService.generate.mockReturnValue('test-fingerprint');
    cache.set.mockResolvedValue(undefined);

    matchingService.matchJobs.mockResolvedValue([]);

    await service.runForUser(123);

    expect(notificationService.sendJobs).not.toHaveBeenCalled();
  });
});
