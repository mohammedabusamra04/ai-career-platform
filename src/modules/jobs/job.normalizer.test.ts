import { describe, expect, it } from 'vitest';

import { normalizeJob } from './job.normalizer.js';
import { validateJob } from './job.validator.js';
import { JobSource } from './job.types.js';
import { ExperienceLevel, WorkType } from '../../shared/types/job.js';

describe('Job normalization', () => {
  it('should normalize a valid raw job', () => {
    const rawJob = {
      title: '  Node.js Developer  ',
      company: '  Google  ',
      source: JobSource.LINKEDIN,
      applicationUrl: '  https://example.com/job  ',
      location: '  Remote  ',
      country: '  Palestine  ',
      workType: WorkType.REMOTE,
      experienceLevel: ExperienceLevel.JUNIOR,
      description: '  Backend developer position  ',
      skills: ['Node.js', 'MongoDB'],
      publicationDate: '2026-08-27T10:00:00Z',
    };

    const job = normalizeJob(rawJob);

    expect(job.title).toBe('Node.js Developer');
    expect(job.company).toBe('Google');
    expect(job.applicationUrl).toBe('https://example.com/job');
    expect(job.location).toBe('Remote');
    expect(job.country).toBe('Palestine');
    expect(job.source).toBe(JobSource.LINKEDIN);
    expect(job.workType).toBe(WorkType.REMOTE);
    expect(job.experienceLevel).toBe(ExperienceLevel.JUNIOR);
    expect(job.description).toBe('Backend developer position');
    expect(job.skills).toEqual(['Node.js', 'MongoDB']);

    expect(job.publicationDate).toBeInstanceOf(Date);
    expect(job.scrapedAt).toBeInstanceOf(Date);
  });

  it('should use an empty skills array when skills are missing', () => {
    const job = normalizeJob({
      title: 'Backend Developer',
      company: 'Google',
      applicationUrl: 'https://example.com/job',
      publicationDate: '2026-08-27T10:00:00Z',
    });

    expect(job.skills).toEqual([]);
  });
});

describe('Job validation', () => {
  it('should validate a correct job', () => {
    const job = normalizeJob({
      title: 'Backend Developer',
      company: 'Google',
      source: JobSource.LINKEDIN,
      applicationUrl: 'https://example.com/job',
      publicationDate: '2026-08-27T10:00:00Z',
    });

    expect(validateJob(job)).toBe(true);
  });

  it('should reject a job without a title', () => {
    const job = normalizeJob({
      title: '',
      company: 'Google',
      source: JobSource.LINKEDIN,
      applicationUrl: 'https://example.com/job',
      publicationDate: '2026-08-27T10:00:00Z',
    });

    expect(validateJob(job)).toBe(false);
  });

  it('should reject a job without a company', () => {
    const job = normalizeJob({
      title: 'Backend Developer',
      company: '',
      source: JobSource.LINKEDIN,
      applicationUrl: 'https://example.com/job',
      publicationDate: '2026-08-27T10:00:00Z',
    });

    expect(validateJob(job)).toBe(false);
  });

  it('should reject a job without an application URL', () => {
    const job = normalizeJob({
      title: 'Backend Developer',
      company: 'Google',
      source: JobSource.LINKEDIN,
      applicationUrl: '',
      publicationDate: '2026-08-27T10:00:00Z',
    });

    expect(validateJob(job)).toBe(false);
  });
  it('should reject a job with an invalid application URL', () => {
    const job = normalizeJob({
      title: 'Backend Developer',
      company: 'Google',
      source: JobSource.LINKEDIN,
      applicationUrl: 'not-a-url',
      publicationDate: '2026-08-27T10:00:00Z',
    });

    expect(validateJob(job)).toBe(false);
  });
});
