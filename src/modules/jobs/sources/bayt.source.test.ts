import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BaytJobSource } from './bayt.source.js';
import { JobSourceType } from '../job.types.js';

describe('BaytJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and parse Bayt job listings', async () => {
    const mockHtml = `
      <ul>
        <li class="has-pointer-d">
          <h2>
            <a href="/en/saudi-arabia/jobs/senior-nodejs-developer-12345/">Senior Node.js Developer</a>
          </h2>
          <b class="t-nowrap">Global Tech Solutions</b>
          <span class="t-mute">Riyadh, Saudi Arabia</span>
        </li>
      </ul>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockHtml),
    } as unknown as Response);

    const source = new BaytJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Node.js Developer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Node.js Developer',
      company: 'Global Tech Solutions',
      source: JobSourceType.BAYT,
      applicationUrl: 'https://www.bayt.com/en/saudi-arabia/jobs/senior-nodejs-developer-12345/',
      location: 'Riyadh, Saudi Arabia',
    });
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const source = new BaytJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'React Developer' });

    expect(jobs).toEqual([]);
  });
});
