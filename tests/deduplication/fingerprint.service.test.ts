import { describe, it, expect } from 'vitest';
import { FingerprintService } from '../../src/modules/deduplication/fingerprint.service.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';

describe('FingerprintService', () => {
  const service = new FingerprintService();

  const baseJob: Job = {
    title: 'Senior Node.js Developer',
    company: 'Google LLC',
    source: JobSourceType.ARBEITNOW,
    applicationUrl: 'https://google.com/jobs/123?utm_source=linkedin&ref=tracker',
    url: 'https://google.com/jobs/123?utm_source=linkedin&ref=tracker',
    skills: ['Node.js'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
  };

  it('should generate identical fingerprints for URLs with different tracking params', () => {
    const job1 = { ...baseJob, applicationUrl: 'https://google.com/jobs/123?utm_source=jobboard' };
    const job2 = { ...baseJob, applicationUrl: 'https://www.google.com/jobs/123/' };

    const fp1 = service.generate(job1);
    const fp2 = service.generate(job2);

    expect(fp1).toBe(fp2);
  });

  it('should generate same semantic fingerprint for same title and company across sources', () => {
    const jobArbeitnow: Job = {
      ...baseJob,
      title: 'Backend Engineer (Remote) [Urgent]',
      company: 'Acme Inc.',
      source: JobSourceType.ARBEITNOW,
      applicationUrl: 'https://arbeitnow.com/job/1',
      url: 'https://arbeitnow.com/job/1',
    };

    const jobRemotive: Job = {
      ...baseJob,
      title: 'Backend Engineer',
      company: 'Acme LLC',
      source: JobSourceType.REMOTIVE,
      applicationUrl: 'https://remotive.com/job/2',
      url: 'https://remotive.com/job/2',
    };

    const sem1 = service.generateSemanticFingerprint(jobArbeitnow);
    const sem2 = service.generateSemanticFingerprint(jobRemotive);

    expect(sem1).toBe(sem2);
  });

  it('should canonicalize URLs by stripping query parameters and www', () => {
    const raw = 'https://WWW.Example.com/jobs/dev/?utm_campaign=winter&ref=123';
    const canonical = service.canonicalizeUrl(raw);
    expect(canonical).toBe('https://example.com/jobs/dev');
  });

  it('should generate different fingerprints for distinct jobs', () => {
    const jobA = { ...baseJob, title: 'Node.js Developer' };
    const jobB = { ...baseJob, title: 'Python Developer' };

    expect(service.generate(jobA)).not.toBe(service.generate(jobB));
  });
});
