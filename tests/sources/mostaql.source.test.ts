import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MostaqlJobSource } from '../../src/modules/jobs/sources/mostaql.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('MostaqlJobSource', () => {
  let source: MostaqlJobSource;

  beforeEach(() => {
    source = new MostaqlJobSource();
    vi.restoreAllMocks();
  });

  it('should have type MOSTAQEL', () => {
    expect(source.type).toBe(JobSourceType.MOSTAQEL);
  });

  it('should parse Mostaql HTML project listings properly', async () => {
    const mockHtml = `
      <div class="project-card">
        <h2 class="project-title">
          <a href="/project/12345-backend-api">بناء واجهة برمجية للتحكم في المخزون Node.js</a>
        </h2>
        <p class="project-brief">مطلوب مطور Node.js محترف لبناء REST API متكامل.</p>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'بناء واجهة برمجية للتحكم في المخزون Node.js',
      company: 'مستقل (مشروع فريلانس)',
      source: JobSourceType.MOSTAQEL,
      applicationUrl: 'https://mostaql.com/project/12345-backend-api',
      url: 'https://mostaql.com/project/12345-backend-api',
      remote: true,
    });
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const jobs = await source.fetchJobs({ jobTitle: 'backend' });
    expect(jobs).toEqual([]);
  });
});
