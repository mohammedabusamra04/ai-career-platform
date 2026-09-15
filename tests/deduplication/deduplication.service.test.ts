import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeduplicationService } from '../../src/modules/deduplication/deduplication.service.js';
import { FingerprintService } from '../../src/modules/deduplication/fingerprint.service.js';
import type { Cache } from '../../src/cache/cache.interface.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';

describe('DeduplicationService', () => {
  let deduplicationService: DeduplicationService;
  let fingerprintService: FingerprintService;
  let cache: Cache;

  beforeEach(() => {
    fingerprintService = new FingerprintService();
    cache = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      setIfNotExists: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    deduplicationService = new DeduplicationService(fingerprintService, cache);
  });

  it('should return unique jobs when all jobs are distinct', async () => {
    const jobs: Job[] = [
      {
        title: 'Backend Developer',
        company: 'Stripe',
        source: JobSourceType.WE_WORK_REMOTELY,
        applicationUrl: 'https://stripe.com/jobs/1',
        url: 'https://stripe.com/jobs/1',
        skills: ['Node.js'],
        publicationDate: new Date(),
        scrapedAt: new Date(),
      },
      {
        title: 'Frontend Developer',
        company: 'Vercel',
        source: JobSourceType.ARBEITNOW,
        applicationUrl: 'https://vercel.com/jobs/2',
        url: 'https://vercel.com/jobs/2',
        skills: ['React'],
        publicationDate: new Date(),
        scrapedAt: new Date(),
      },
    ];

    const result = await deduplicationService.deduplicate(jobs);
    expect(result.uniqueJobs).toHaveLength(2);
    expect(result.duplicateJobs).toHaveLength(0);
  });

  it('should deduplicate jobs with duplicate URLs and keep the richer one', async () => {
    const job1: Job = {
      title: 'Node.js Engineer',
      company: 'Acme',
      source: JobSourceType.ARBEITNOW,
      applicationUrl: 'https://acme.com/jobs/1',
      url: 'https://acme.com/jobs/1',
      skills: ['Node.js'],
      publicationDate: new Date(),
      scrapedAt: new Date(),
    };

    const job2: Job = {
      title: 'Node.js Engineer',
      company: 'Acme',
      source: JobSourceType.REMOTIVE,
      applicationUrl: 'https://acme.com/jobs/1?ref=remotive',
      url: 'https://acme.com/jobs/1?ref=remotive',
      skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
      description: 'Full job description with tech stack',
      location: 'Remote',
      salaryMin: 60000,
      salaryMax: 80000,
      publicationDate: new Date(),
      scrapedAt: new Date(),
    };

    const result = await deduplicationService.deduplicate([job1, job2]);
    expect(result.uniqueJobs).toHaveLength(1);
    expect(result.duplicateJobs).toHaveLength(1);
    expect(result.uniqueJobs[0].skills).toHaveLength(3);
    expect(result.uniqueJobs[0].salaryMin).toBe(60000);
  });

  it('should detect cross-source duplicates with same title and company', async () => {
    const jobA: Job = {
      title: 'Senior Backend Developer (Remote)',
      company: 'Amazon Web Services Inc.',
      source: JobSourceType.BAYT,
      applicationUrl: 'https://bayt.com/job/100',
      url: 'https://bayt.com/job/100',
      skills: ['Node.js'],
      publicationDate: new Date(),
      scrapedAt: new Date(),
    };

    const jobB: Job = {
      title: 'Senior Backend Developer',
      company: 'Amazon Web Services',
      source: JobSourceType.TANQEEB,
      applicationUrl: 'https://tanqeeb.com/job/200',
      url: 'https://tanqeeb.com/job/200',
      skills: ['Node.js', 'AWS'],
      description: 'Detailed description of AWS backend role',
      publicationDate: new Date(),
      scrapedAt: new Date(),
    };

    const result = await deduplicationService.deduplicate([jobA, jobB]);
    expect(result.uniqueJobs).toHaveLength(1);
    expect(result.duplicateJobs).toHaveLength(1);
  });
});
