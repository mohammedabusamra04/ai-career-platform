import { describe, it, expect, vi } from 'vitest';
import { JobSourceManager } from '../../src/modules/jobs/sources/job-source.manager.js';
import type { JobSource } from '../../src/modules/jobs/sources/job-source.interface.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';

describe('JobSourceManager', () => {
  const dummyJob: Job = {
    title: 'Node.js Developer',
    company: 'Test Company',
    source: JobSourceType.REMOTIVE,
    applicationUrl: 'https://example.com/job',
    url: 'https://example.com/job',
    skills: ['Node.js'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
  };

  it('should collect jobs from all sources and return combined results', async () => {
    const source1: JobSource = {
      type: JobSourceType.ARBEITNOW,
      fetchJobs: vi.fn().mockResolvedValue([dummyJob]),
    };
    const source2: JobSource = {
      type: JobSourceType.TANQEEB,
      fetchJobs: vi.fn().mockResolvedValue([dummyJob]),
    };

    const manager = new JobSourceManager([source1, source2]);
    const jobs = await manager.fetchJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(2);
    expect(manager.getSources()).toHaveLength(2);
    expect(manager.getLastFailedSources()).toHaveLength(0);
  });

  it('should continue fetching when one source fails and track failed sources', async () => {
    const workingSource: JobSource = {
      type: JobSourceType.REMOTIVE,
      fetchJobs: vi.fn().mockResolvedValue([dummyJob]),
    };
    const failingSource: JobSource = {
      type: JobSourceType.JOOBLE,
      fetchJobs: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')),
    };

    const manager = new JobSourceManager([workingSource, failingSource]);
    const jobs = await manager.fetchJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(1);
    expect(manager.getLastFailedSources()).toEqual([JobSourceType.JOOBLE]);
  });
});
