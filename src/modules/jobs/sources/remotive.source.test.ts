import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RemotiveJobSource } from './remotive.source.js';
import { JobSourceType } from '../job.types.js';
import { WorkType } from '../../../shared/types/job.js';

describe('RemotiveJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and map Remotive jobs successfully', async () => {
    const mockApiResponse = {
      jobs: [
        {
          id: 101,
          url: 'https://remotive.com/remote-jobs/software-dev/senior-backend-engineer-101',
          title: 'Senior Backend Engineer',
          company_name: 'Tech Innovators',
          category: 'Software Development',
          tags: ['Node.js', 'TypeScript', 'Redis'],
          job_type: 'full_time',
          publication_date: '2026-09-08T09:00:00',
          candidate_required_location: 'Worldwide',
          description: '<p>Great <b>backend</b> role with Node.js</p>',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as unknown as Response);

    const source = new RemotiveJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Backend Engineer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Backend Engineer',
      company: 'Tech Innovators',
      source: JobSourceType.REMOTIVE,
      applicationUrl: 'https://remotive.com/remote-jobs/software-dev/senior-backend-engineer-101',
      workType: WorkType.REMOTE,
      location: 'Worldwide',
      skills: ['Node.js', 'TypeScript', 'Redis'],
      description: 'Great backend role with Node.js',
    });
    expect(jobs[0].publicationDate).toBeInstanceOf(Date);
  });

  it('should return empty array when HTTP response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const source = new RemotiveJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'DevOps' });

    expect(jobs).toEqual([]);
  });

  it('should return empty array when network error occurs', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const source = new RemotiveJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'React' });

    expect(jobs).toEqual([]);
  });
});
