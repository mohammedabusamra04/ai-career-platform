import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaytJobSource } from '../../src/modules/jobs/sources/bayt.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('BaytJobSource', () => {
  let source: BaytJobSource;

  beforeEach(() => {
    source = new BaytJobSource();
    vi.restoreAllMocks();
  });

  it('should have type BAYT', () => {
    expect(source.type).toBe(JobSourceType.BAYT);
  });

  it('should parse Bayt HTML and return mapped jobs', async () => {
    const mockHtml = `
      <ul>
        <li data-js-job>
          <h2><a href="/en/saudi-arabia/jobs/senior-nodejs-developer-12345/">Senior Node.js Developer</a></h2>
          <b class="company">Saudi Tech Co</b>
          <span class="t-mute">Riyadh, Saudi Arabia</span>
        </li>
      </ul>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Node.js Developer',
      company: 'Saudi Tech Co',
      source: JobSourceType.BAYT,
      applicationUrl: 'https://www.bayt.com/en/saudi-arabia/jobs/senior-nodejs-developer-12345/',
      url: 'https://www.bayt.com/en/saudi-arabia/jobs/senior-nodejs-developer-12345/',
      location: 'Riyadh, Saudi Arabia',
    });
  });

  it('should return empty array when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Blocked'));
    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
