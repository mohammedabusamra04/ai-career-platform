import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WuzzufJobSource } from '../../src/modules/jobs/sources/wuzzuf.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('WuzzufJobSource', () => {
  let source: WuzzufJobSource;

  beforeEach(() => {
    source = new WuzzufJobSource();
    vi.restoreAllMocks();
  });

  it('should have type WUZZUF', () => {
    expect(source.type).toBe(JobSourceType.WUZZUF);
  });

  it('should parse Wuzzuf search HTML listings', async () => {
    const mockHtml = `
      <div class="css-1gatmva">
        <h2><a href="/jobs/p/123-backend-developer">Backend Developer</a></h2>
        <a class="css-ipsyv7">Cairo Tech Ltd</a>
        <span class="css-5wys0k">Cairo, Egypt</span>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'Backend Developer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Backend Developer',
      company: 'Cairo Tech Ltd',
      source: JobSourceType.WUZZUF,
      applicationUrl: 'https://wuzzuf.net/jobs/p/123-backend-developer',
      url: 'https://wuzzuf.net/jobs/p/123-backend-developer',
      location: 'Cairo, Egypt',
    });
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Blocked'));
    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
