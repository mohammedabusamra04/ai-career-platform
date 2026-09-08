import { describe, expect, it } from 'vitest';
import { validateJob } from './job.validator.js';
import { JobSourceType, type Job } from './job.types.js';
import { ExperienceLevel, WorkType } from '../../shared/types/job.js';

describe('JobValidator', () => {
  const createValidJob = (overrides: Partial<Job> = {}): Job => ({
    title: 'Senior Backend Engineer',
    company: 'Tech Corp',
    source: JobSourceType.BAEED,
    applicationUrl: 'https://example.com/jobs/123',
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.SENIOR,
    skills: ['TypeScript', 'Node.js'],
    publicationDate: new Date('2026-09-08T10:00:00Z'),
    scrapedAt: new Date('2026-09-08T11:00:00Z'),
    ...overrides,
  });

  it('should validate a complete and valid job object', () => {
    const job = createValidJob();
    expect(validateJob(job)).toBe(true);
  });

  it('should accept http and https application URLs', () => {
    expect(validateJob(createValidJob({ applicationUrl: 'http://example.com/job' }))).toBe(true);
    expect(validateJob(createValidJob({ applicationUrl: 'https://example.com/job' }))).toBe(true);
  });

  it('should reject a job with an empty or whitespace title', () => {
    expect(validateJob(createValidJob({ title: '' }))).toBe(false);
    expect(validateJob(createValidJob({ title: '   ' }))).toBe(false);
  });

  it('should reject a job with an empty or whitespace company', () => {
    expect(validateJob(createValidJob({ company: '' }))).toBe(false);
    expect(validateJob(createValidJob({ company: '   ' }))).toBe(false);
  });

  it('should reject invalid application URLs', () => {
    expect(validateJob(createValidJob({ applicationUrl: '' }))).toBe(false);
    expect(validateJob(createValidJob({ applicationUrl: 'not-a-valid-url' }))).toBe(false);
    expect(validateJob(createValidJob({ applicationUrl: 'ftp://example.com/job' }))).toBe(false);
    expect(validateJob(createValidJob({ applicationUrl: 'javascript:alert(1)' }))).toBe(false);
  });

  it('should reject an invalid or unknown job source', () => {
    expect(validateJob(createValidJob({ source: 'INVALID_SOURCE' as JobSourceType }))).toBe(false);
  });

  it('should reject an invalid publicationDate', () => {
    expect(validateJob(createValidJob({ publicationDate: new Date('invalid-date') }))).toBe(false);
    expect(validateJob(createValidJob({ publicationDate: '2026-09-08' as unknown as Date }))).toBe(
      false,
    );
  });

  it('should reject an invalid scrapedAt date', () => {
    expect(validateJob(createValidJob({ scrapedAt: new Date('invalid-date') }))).toBe(false);
    expect(validateJob(createValidJob({ scrapedAt: null as unknown as Date }))).toBe(false);
  });
});
