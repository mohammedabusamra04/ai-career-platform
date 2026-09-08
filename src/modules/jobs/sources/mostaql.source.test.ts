import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MostaqlJobSource } from './mostaql.source.js';
import { JobSourceType } from '../job.types.js';

describe('MostaqlJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and parse Mostaql project listings', async () => {
    const mockHtml = `
      <div class="project-row">
        <h2 class="mrg--bt-reset card--title">
          <a href="/project/12345-backend-api">تطوير API لمنصة تعليمية</a>
        </h2>
        <p class="card--desc project__brief text-muted">مطلوب مبرمج Node.js و Express لبناء REST API</p>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockHtml),
    } as unknown as Response);

    const source = new MostaqlJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'تطوير API لمنصة تعليمية',
      company: 'مستقل (مشروع فريلانس)',
      source: JobSourceType.MOSTAQEL,
      applicationUrl: 'https://mostaql.com/project/12345-backend-api',
      description: 'مطلوب مبرمج Node.js و Express لبناء REST API',
    });
  });

  it('should return empty array on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const source = new MostaqlJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Flutter' });

    expect(jobs).toEqual([]);
  });
});
