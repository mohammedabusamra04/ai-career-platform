import { describe, it, expect, vi } from 'vitest';
import { JobCollectionService } from '../../src/modules/jobs/job.collection.service.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';

describe('JobCollectionService', () => {
  const dummyJob: Job = {
    title: 'Node.js Developer',
    company: 'Acme',
    source: JobSourceType.ARBEITNOW,
    applicationUrl: 'https://example.com/job',
    url: 'https://example.com/job',
    skills: ['Node.js'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
  };

  it('should collect and filter out invalid jobs', async () => {
    const manager = {
      fetchJobs: vi.fn().mockResolvedValue([
        dummyJob,
        {
          ...dummyJob,
          title: '', // Invalid job missing title
        },
      ]),
    };

    const service = new JobCollectionService(manager);
    const jobs = await service.collectJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Node.js Developer');
  });
});
