import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeduplicationService } from './deduplication.service.js';
import { FingerprintService } from './fingerprint.service.js';
import { JobSourceType } from '../jobs/job.types.js';
import { WorkType, ExperienceLevel } from '../../shared/types/job.js';
import type { Job } from '../jobs/job.types.js';

describe('DeduplicationService', () => {
  const cache = {
    get: vi.fn(),
    set: vi.fn(),
    setIfNotExists: vi.fn(),
    delete: vi.fn(),
  };

  const service = new DeduplicationService(new FingerprintService(), cache);

  const createJob = (overrides: Partial<Job> = {}): Job => ({
    title: 'Backend Developer',
    company: 'Google',
    source: JobSourceType.LINKEDIN,
    applicationUrl: 'https://google.com/jobs/123',
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.JUNIOR,
    skills: ['Node.js'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all jobs as unique when there are no duplicates', async () => {
    cache.setIfNotExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    const jobs = [
      createJob(),
      createJob({
        title: 'Frontend Developer',
        applicationUrl: 'https://google.com/jobs/456',
      }),
    ];

    const result = await service.deduplicate(jobs);

    expect(result.uniqueJobs).toHaveLength(2);
    expect(result.duplicateJobs).toHaveLength(0);
  });

  it('should detect duplicate jobs', async () => {
    cache.setIfNotExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const jobs = [
      createJob(),
      createJob({
        source: JobSourceType.BAYT,
      }),
    ];

    const result = await service.deduplicate(jobs);

    expect(result.uniqueJobs).toHaveLength(1);
    expect(result.duplicateJobs).toHaveLength(1);
  });

  it('should not remove jobs with similar titles but different companies', async () => {
    cache.setIfNotExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    const jobs = [
      createJob(),
      createJob({
        company: 'Amazon',
        applicationUrl: 'https://amazon.com/jobs/123',
      }),
    ];

    const result = await service.deduplicate(jobs);

    expect(result.uniqueJobs).toHaveLength(2);
    expect(result.duplicateJobs).toHaveLength(0);
  });

  it('should detect multiple duplicates of the same job', async () => {
    cache.setIfNotExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    const jobs = [
      createJob(),
      createJob({ source: JobSourceType.BAYT }),
      createJob({ source: JobSourceType.MOSTAQEL }),
    ];

    const result = await service.deduplicate(jobs);

    expect(result.uniqueJobs).toHaveLength(1);
    expect(result.duplicateJobs).toHaveLength(2);
  });

  it('should detect jobs that already exist in cache', async () => {
    cache.setIfNotExists.mockResolvedValueOnce(false);

    const jobs = [createJob()];

    const result = await service.deduplicate(jobs);

    expect(result.uniqueJobs).toHaveLength(0);
    expect(result.duplicateJobs).toHaveLength(1);
  });

  it('should keep the most useful version of a duplicate job', async () => {
    cache.setIfNotExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const basicJob = createJob({
      description: undefined,
      location: undefined,
      country: undefined,
      skills: [],
    });

    const detailedJob = createJob({
      source: JobSourceType.BAYT,
      description: 'Backend Developer role',
      location: 'Remote',
      country: 'Palestine',
      skills: ['Node.js', 'TypeScript', 'Redis'],
    });

    const result = await service.deduplicate([basicJob, detailedJob]);

    expect(result.uniqueJobs).toHaveLength(1);
    expect(result.uniqueJobs[0]).toBe(detailedJob);
    expect(result.duplicateJobs).toHaveLength(1);
  });

  it('should prevent race conditions when the same job is processed concurrently', async () => {
    cache.setIfNotExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const job = createJob();

    const [firstResult, secondResult] = await Promise.all([
      service.deduplicate([job]),
      service.deduplicate([job]),
    ]);

    const uniqueJobsCount = firstResult.uniqueJobs.length + secondResult.uniqueJobs.length;

    const duplicateJobsCount = firstResult.duplicateJobs.length + secondResult.duplicateJobs.length;

    expect(uniqueJobsCount).toBe(1);
    expect(duplicateJobsCount).toBe(1);

    expect(cache.setIfNotExists).toHaveBeenCalledTimes(2);
  });
});
