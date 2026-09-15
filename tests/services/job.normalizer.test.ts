import { describe, it, expect } from 'vitest';
import { normalizeJob } from '../../src/modules/jobs/job.normalizer.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';
import { WorkType } from '../../src/shared/types/job.js';

describe('normalizeJob', () => {
  it('should trim string fields and set default values', () => {
    const raw = {
      title: '  Senior Backend Developer  ',
      company: '  Google  ',
      applicationUrl: '  https://google.com/jobs/123  ',
      location: '  London, UK  ',
      remote: true,
      salaryMin: 70000,
      salaryMax: 90000,
      currency: 'GBP',
      skills: ['Node.js', 'TypeScript'],
    };

    const job = normalizeJob(raw);

    expect(job.title).toBe('Senior Backend Developer');
    expect(job.company).toBe('Google');
    expect(job.applicationUrl).toBe('https://google.com/jobs/123');
    expect(job.url).toBe('https://google.com/jobs/123');
    expect(job.location).toBe('London, UK');
    expect(job.remote).toBe(true);
    expect(job.salaryMin).toBe(70000);
    expect(job.salaryMax).toBe(90000);
    expect(job.currency).toBe('GBP');
    expect(job.skills).toEqual(['Node.js', 'TypeScript']);
    expect(job.source).toBe(JobSourceType.OTHER);
    expect(job.publicationDate).toBeInstanceOf(Date);
    expect(job.publishedAt).toBeInstanceOf(Date);
  });

  it('should infer remote flag from title or workType', () => {
    const job1 = normalizeJob({
      title: 'Full Stack Engineer (Remote)',
      company: 'Vercel',
      url: 'https://vercel.com/job/1',
    });
    expect(job1.remote).toBe(true);

    const job2 = normalizeJob({
      title: 'Backend Engineer',
      workType: WorkType.REMOTE,
      company: 'Meta',
      url: 'https://meta.com/job/2',
    });
    expect(job2.remote).toBe(true);
  });

  it('should strip HTML tags from descriptions', () => {
    const job = normalizeJob({
      title: 'DevOps Engineer',
      company: 'Cloud Corp',
      url: 'https://cloud.com/job/3',
      description: '<p>Looking for <strong>AWS</strong> &amp; <em>Docker</em> expert.</p>',
    });

    expect(job.description).not.toContain('<p>');
    expect(job.description).not.toContain('<strong>');
    expect(job.description).toContain('Looking for');
  });
});
