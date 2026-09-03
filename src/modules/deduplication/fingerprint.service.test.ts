import { describe, expect, it } from 'vitest';

import { FingerprintService } from './fingerprint.service.js';
import { JobSourceType } from '../jobs/job.types.js';
import { WorkType, ExperienceLevel } from '../../shared/types/job.js';
import type { Job } from '../jobs/job.types.js';

describe('FingerprintService', () => {
  const service = new FingerprintService();

  const createJob = (overrides: Partial<Job> = {}): Job => ({
    title: 'Backend Developer',
    company: 'Google',
    source: JobSourceType.LINKEDIN,
    applicationUrl: 'https://google.com/jobs/123',
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.JUNIOR,
    skills: ['Node.js'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
    ...overrides,
  });

  it('should generate a fingerprint', () => {
    const fingerprint = service.generate(createJob());

    expect(fingerprint).toBeTruthy();
    expect(fingerprint).toHaveLength(64);
  });

  it('should generate the same fingerprint for equivalent jobs', () => {
    const firstFingerprint = service.generate(createJob());

    const secondFingerprint = service.generate(
      createJob({
        title: ' backend developer ',
        company: ' GOOGLE ',
        applicationUrl: 'https://GOOGLE.com/jobs/123',
      }),
    );

    expect(firstFingerprint).toBe(secondFingerprint);
  });

  it('should generate different fingerprints for different companies', () => {
    const firstFingerprint = service.generate(createJob());

    const secondFingerprint = service.generate(
      createJob({
        company: 'Amazon',
      }),
    );

    expect(firstFingerprint).not.toBe(secondFingerprint);
  });

  it('should generate different fingerprints for different URLs', () => {
    const firstFingerprint = service.generate(createJob());

    const secondFingerprint = service.generate(
      createJob({
        applicationUrl: 'https://google.com/jobs/456',
      }),
    );

    expect(firstFingerprint).not.toBe(secondFingerprint);
  });
});
