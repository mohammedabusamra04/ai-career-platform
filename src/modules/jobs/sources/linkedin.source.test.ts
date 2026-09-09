import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LinkedinJobSource } from './linkedin.source.js';
import { JobSourceType } from '../job.types.js';
import { WorkType } from '../../../shared/types/job.js';

describe('LinkedinJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return empty array when API key is empty', async () => {
    const source = new LinkedinJobSource('');
    const jobs = await source.fetchJobs({ jobTitle: 'Backend Developer' });

    expect(jobs).toEqual([]);
  });

  it('should fetch and map JSearch jobs when API key is provided', async () => {
    const mockApiResponse = {
      status: 'OK',
      data: [
        {
          job_id: 'abc123',
          job_title: 'Full Stack Engineer',
          employer_name: 'Microsoft',
          job_apply_link: 'https://careers.microsoft.com/job/abc123',
          job_city: 'Remote',
          job_is_remote: true,
          job_description: 'Full stack development role',
          job_posted_at_datetime_utc: '2026-09-08T08:00:00.000Z',
          job_required_skills: ['React', 'TypeScript', 'Node.js'],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as unknown as Response);

    const source = new LinkedinJobSource('test-rapidapi-key');
    const jobs = await source.fetchJobs({ jobTitle: 'Full Stack Engineer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Full Stack Engineer',
      company: 'Microsoft',
      source: JobSourceType.LINKEDIN,
      applicationUrl: 'https://careers.microsoft.com/job/abc123',
      workType: WorkType.REMOTE,
      location: 'Remote',
      skills: ['React', 'TypeScript', 'Node.js'],
    });
  });

  it('should return empty array when API returns error status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as unknown as Response);

    const source = new LinkedinJobSource('test-rapidapi-key');
    const jobs = await source.fetchJobs({ jobTitle: 'QA Engineer' });

    expect(jobs).toEqual([]);
  });
});
