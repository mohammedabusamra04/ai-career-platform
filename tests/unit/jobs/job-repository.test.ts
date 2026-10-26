import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import {
  PrismaJobRepository,
  type NormalizedJobInput,
} from '../../../src/modules/jobs/index.js';

describe('PrismaJobRepository - Atomic Upsert & Job Storage (TASK-22.1)', () => {
  let mockPrisma: any;
  let repository: PrismaJobRepository;

  const sampleJobInput: NormalizedJobInput = {
    deduplicationKey: 'job-hash-12345',
    semanticKey: 'semantic-key-backend-google',
    title: 'Senior Backend Engineer',
    company: 'Tech Corp',
    source: 'linkedin',
    url: 'https://example.com/jobs/123',
    applicationUrl: 'https://example.com/apply/123',
    location: 'Dubai, UAE',
    country: 'UAE',
    remoteScope: 'WORLDWIDE',
    primarySpecialization: 'BACKEND',
    secondarySpecialization: 'DEVOPS',
    experienceLevel: 'SENIOR',
    workType: 'FULL_TIME',
    description: 'We are looking for a Senior Backend Engineer proficient in Node.js and Postgres.',
    skills: ['Node.js', 'PostgreSQL', 'TypeScript'],
    salaryMin: 5000,
    salaryMax: 8000,
    currency: 'USD',
    publishedAt: new Date('2026-10-25T10:00:00Z'),
  };

  const sampleDbRecord = {
    id: 'job-uuid-1',
    ...sampleJobInput,
    applicationUrl: sampleJobInput.applicationUrl!,
    location: sampleJobInput.location!,
    country: sampleJobInput.country!,
    secondarySpecialization: sampleJobInput.secondarySpecialization!,
    salaryMin: sampleJobInput.salaryMin!,
    salaryMax: sampleJobInput.salaryMax!,
    currency: sampleJobInput.currency!,
    status: 'ACTIVE',
    scrapedAt: new Date('2026-10-25T10:05:00Z'),
    lastSeenAt: new Date('2026-10-25T10:05:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      job: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(async (callback: any) => callback(mockPrisma)),
    };
    repository = new PrismaJobRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('upsertJob', () => {
    it('inserts a new job with status ACTIVE and timestamps when deduplicationKey does not exist', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);
      mockPrisma.job.create.mockResolvedValue(sampleDbRecord);

      const result = await repository.upsertJob(sampleJobInput);

      expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
        where: { deduplicationKey: sampleJobInput.deduplicationKey },
      });
      expect(mockPrisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deduplicationKey: sampleJobInput.deduplicationKey,
          title: sampleJobInput.title,
          status: 'ACTIVE',
          skills: sampleJobInput.skills,
        }),
      });
      expect(result.id).toBe('job-uuid-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('updates an existing job in-place, bumps lastSeenAt, and updates description and URL', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(sampleDbRecord);

      const updatedInput: NormalizedJobInput = {
        ...sampleJobInput,
        url: 'https://example.com/jobs/123-new-link',
        description: 'Updated comprehensive job description with new team details.',
      };

      const updatedRecord = {
        ...sampleDbRecord,
        url: updatedInput.url,
        description: updatedInput.description,
        lastSeenAt: new Date('2026-10-26T18:00:00Z'),
      };
      mockPrisma.job.update.mockResolvedValue(updatedRecord);

      const result = await repository.upsertJob(updatedInput);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { deduplicationKey: sampleJobInput.deduplicationKey },
        data: expect.objectContaining({
          url: 'https://example.com/jobs/123-new-link',
          description: 'Updated comprehensive job description with new team details.',
          lastSeenAt: expect.any(Date),
        }),
      });
      expect(result.url).toBe('https://example.com/jobs/123-new-link');
      expect(result.description).toBe(
        'Updated comprehensive job description with new team details.',
      );
    });

    it('preserves existing non-null fields when incoming update has empty or missing values (no null overwrites)', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(sampleDbRecord);

      const sparseUpdateInput: NormalizedJobInput = {
        deduplicationKey: sampleJobInput.deduplicationKey,
        semanticKey: sampleJobInput.semanticKey,
        title: sampleJobInput.title,
        company: sampleJobInput.company,
        source: sampleJobInput.source,
        url: sampleJobInput.url,
        description: '', // Empty incoming description
        applicationUrl: null, // Null incoming applicationUrl
        location: null, // Null incoming location
        primarySpecialization: 'BACKEND',
        publishedAt: sampleJobInput.publishedAt,
      };

      mockPrisma.job.update.mockResolvedValue(sampleDbRecord);

      await repository.upsertJob(sparseUpdateInput);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { deduplicationKey: sampleJobInput.deduplicationKey },
        data: expect.objectContaining({
          description: sampleDbRecord.description, // Kept existing non-empty description
          applicationUrl: sampleDbRecord.applicationUrl, // Kept existing applicationUrl
          location: sampleDbRecord.location, // Kept existing location
          lastSeenAt: expect.any(Date),
        }),
      });
    });

    it('merges incoming skills with existing skills without duplicates', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(sampleDbRecord);

      const inputWithNewSkills: NormalizedJobInput = {
        ...sampleJobInput,
        skills: ['TypeScript', 'Docker', 'Kubernetes'],
      };

      mockPrisma.job.update.mockResolvedValue({
        ...sampleDbRecord,
        skills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'Kubernetes'],
      });

      await repository.upsertJob(inputWithNewSkills);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { deduplicationKey: sampleJobInput.deduplicationKey },
        data: expect.objectContaining({
          skills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'Kubernetes'],
        }),
      });
    });
  });

  describe('findById & findByDeduplicationKey', () => {
    it('returns mapped entity when job is found by id', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(sampleDbRecord);

      const result = await repository.findById('job-uuid-1');

      expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-uuid-1' },
      });
      expect(result?.title).toBe('Senior Backend Engineer');
    });

    it('returns null when job is not found by id', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('returns mapped entity when job is found by deduplicationKey', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(sampleDbRecord);

      const result = await repository.findByDeduplicationKey('job-hash-12345');

      expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
        where: { deduplicationKey: 'job-hash-12345' },
      });
      expect(result?.deduplicationKey).toBe('job-hash-12345');
    });
  });

  describe('count', () => {
    it('delegates count to Prisma client', async () => {
      mockPrisma.job.count.mockResolvedValue(42);

      const count = await repository.count();

      expect(mockPrisma.job.count).toHaveBeenCalled();
      expect(count).toBe(42);
    });
  });
});
