import { describe, it, expect } from 'vitest';
import { validateJob } from '../../src/modules/jobs/job.validator.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';

describe('validateJob', () => {
  const createValidJob = (overrides: Partial<Job> = {}): Job => ({
    title: 'Software Engineer',
    company: 'Acme',
    source: JobSourceType.ARBEITNOW,
    applicationUrl: 'https://example.com/jobs/123',
    url: 'https://example.com/jobs/123',
    skills: ['TypeScript'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
    ...overrides,
  });

  it('should return true for a valid job object', () => {
    expect(validateJob(createValidJob())).toBe(true);
  });

  it('should return false for missing or blank title', () => {
    expect(validateJob(createValidJob({ title: '' }))).toBe(false);
    expect(validateJob(createValidJob({ title: '   ' }))).toBe(false);
  });

  it('should return false for missing or blank company', () => {
    expect(validateJob(createValidJob({ company: '' }))).toBe(false);
  });

  it('should validate URLs properly', () => {
    expect(validateJob(createValidJob({ applicationUrl: 'http://example.com/job' }))).toBe(true);
    expect(validateJob(createValidJob({ applicationUrl: 'https://example.com/job' }))).toBe(true);
    expect(validateJob(createValidJob({ applicationUrl: '', url: '' }))).toBe(false);
    expect(validateJob(createValidJob({ applicationUrl: 'invalid-url', url: 'invalid-url' }))).toBe(false);
  });
});
