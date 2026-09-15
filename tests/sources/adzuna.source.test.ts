import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdzunaJobSource } from '../../src/modules/jobs/sources/adzuna.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('AdzunaJobSource', () => {
  let source: AdzunaJobSource;

  beforeEach(() => {
    source = new AdzunaJobSource('test_app_id', 'test_app_key');
    vi.restoreAllMocks();
  });

  it('should have type ADZUNA', () => {
    expect(source.type).toBe(JobSourceType.ADZUNA);
  });

  it('should return empty array if credentials are missing', async () => {
    const unauthenticatedSource = new AdzunaJobSource('', '');
    const jobs = await unauthenticatedSource.fetchJobs({ jobTitle: 'backend' });
    expect(jobs).toEqual([]);
  });

  it('should fetch and map Adzuna job listings correctly', async () => {
    const mockApiResponse = {
      results: [
        {
          id: '12345',
          title: '<strong>Backend Developer (Remote)</strong>',
          description: 'Build backend APIs with Node.js and TypeScript',
          redirect_url: 'https://www.adzuna.com/land/ad/12345',
          created: '2026-03-10T12:00:00Z',
          salary_min: 50000,
          salary_max: 75000,
          company: {
            display_name: 'Acme Software',
          },
          location: {
            display_name: 'London, UK',
            area: ['UK', 'London'],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'Backend Developer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Backend Developer (Remote)');
    expect(jobs[0].company).toBe('Acme Software');
    expect(jobs[0].source).toBe(JobSourceType.ADZUNA);
    expect(jobs[0].url).toBe('https://www.adzuna.com/land/ad/12345');
    expect(jobs[0].salaryMin).toBe(50000);
    expect(jobs[0].salaryMax).toBe(75000);
    expect(jobs[0].currency).toBe('GBP');
    expect(jobs[0].remote).toBe(true);
  });

  it('should handle API errors without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'));

    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
