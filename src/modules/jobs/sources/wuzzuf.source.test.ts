import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { WuzzufJobSource } from './wuzzuf.source.js';
import { JobSourceType } from '../job.types.js';

describe('WuzzufJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and parse Wuzzuf job listings', async () => {
    const mockHtml = `
      <div class="css-1gatmva">
        <h2><a class="css-o171kl" href="/jobs/p/123-backend-developer">Backend Developer</a></h2>
        <a class="css-ipsyv7" href="/jobs/company">Tech Corp</a>
        <span class="css-5wys0k">Cairo, Egypt</span>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockHtml),
    } as unknown as Response);

    const source = new WuzzufJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Backend Developer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Backend Developer',
      company: 'Tech Corp',
      source: JobSourceType.WUZZUF,
      applicationUrl: 'https://wuzzuf.net/jobs/p/123-backend-developer',
      location: 'Cairo, Egypt',
    });
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const source = new WuzzufJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'React Developer' });

    expect(jobs).toEqual([]);
  });
});
