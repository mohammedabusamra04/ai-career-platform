import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobCollectionService } from '../../src/modules/jobs/job.collection.service.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';
import { Specialization } from '@prisma/client';

describe('JobCollectionService - Decoupled Collection Pipeline Engine (TASK-26.1 & TASK-26.2)', () => {
  let mockSourceManager: any;
  let mockJobRepository: any;
  let mockDeduplicationService: any;
  let mockFingerprintService: any;
  let mockClassifier: any;
  let mockAdvisoryLock: any;
  let service: JobCollectionService;

  const sampleJob: Job = {
    title: 'Senior Backend Engineer',
    company: 'Acme Corp',
    source: JobSourceType.ARBEITNOW,
    applicationUrl: 'https://example.com/job/1',
    url: 'https://example.com/job/1',
    skills: ['Node.js', 'PostgreSQL'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
  };

  beforeEach(() => {
    mockSourceManager = {
      fetchJobs: vi.fn().mockResolvedValue([sampleJob]),
      fetchJobsDetailed: vi.fn().mockResolvedValue({
        attempted: 3,
        succeeded: 2,
        failed: 1,
        jobs: [sampleJob],
        telemetry: [],
        durationMs: 120,
      }),
      getLastTelemetry: vi.fn().mockReturnValue([]),
    };

    mockJobRepository = {
      upsertJob: vi.fn().mockResolvedValue({ id: 'uuid-1', ...sampleJob }),
      upsertJobWithResult: vi.fn().mockResolvedValue({
        job: { id: 'uuid-1', ...sampleJob },
        isNew: true,
      }),
    };

    mockDeduplicationService = {
      deduplicate: vi.fn().mockResolvedValue({
        uniqueJobs: [sampleJob],
        duplicateJobs: [],
      }),
    };

    mockFingerprintService = {
      generate: vi.fn().mockReturnValue('l1-hash-123'),
      generateSemanticFingerprint: vi.fn().mockReturnValue('l2-hash-123'),
    };

    mockClassifier = {
      classify: vi.fn().mockReturnValue({
        primarySpecialization: Specialization.BACKEND,
        secondarySpecialization: null,
        remoteScope: 'WORLDWIDE',
        experienceLevel: 'SENIOR',
        workType: 'FULL_TIME',
      }),
    };

    mockAdvisoryLock = {
      tryAcquire: vi.fn().mockResolvedValue(true),
      release: vi.fn().mockResolvedValue(true),
      withLock: vi.fn(),
    };

    service = new JobCollectionService(
      mockSourceManager,
      mockJobRepository,
      mockDeduplicationService,
      mockFingerprintService,
      mockClassifier,
      mockAdvisoryLock,
    );
  });

  describe('executeCollectionCycle - Pipeline Sequence & Concurrency Guard (TASK-26.1)', () => {
    it('executes full pipeline sequence: harvest -> normalize -> deduplicate -> classify -> upsert', async () => {
      const outcome = await service.executeCollectionCycle();

      expect(outcome.executed).toBe(true);
      expect(mockAdvisoryLock.tryAcquire).toHaveBeenCalledTimes(1);
      expect(mockSourceManager.fetchJobsDetailed).toHaveBeenCalledTimes(1);
      expect(mockDeduplicationService.deduplicate).toHaveBeenCalledTimes(1);
      expect(mockClassifier.classify).toHaveBeenCalledTimes(1);
      expect(mockJobRepository.upsertJobWithResult).toHaveBeenCalledTimes(1);
      expect(mockAdvisoryLock.release).toHaveBeenCalledTimes(1);

      // Verify Upsert Input
      expect(mockJobRepository.upsertJobWithResult).toHaveBeenCalledWith(
        expect.objectContaining({
          deduplicationKey: 'l1-hash-123',
          semanticKey: 'l2-hash-123',
          primarySpecialization: Specialization.BACKEND,
          title: 'Senior Backend Engineer',
          company: 'Acme Corp',
        }),
      );
    });

    it('prevents concurrent execution when PostgreSQL advisory lock is already held', async () => {
      mockAdvisoryLock.tryAcquire.mockResolvedValueOnce(false);

      const outcome = await service.executeCollectionCycle();

      expect(outcome.executed).toBe(false);
      expect(outcome.skippedReason).toContain('Advisory lock already held');
      expect(mockSourceManager.fetchJobsDetailed).not.toHaveBeenCalled();
      expect(mockJobRepository.upsertJobWithResult).not.toHaveBeenCalled();
      expect(mockAdvisoryLock.release).not.toHaveBeenCalled();
    });

    it('allows forced collection cycle to bypass lock check when force: true', async () => {
      mockAdvisoryLock.tryAcquire.mockResolvedValueOnce(false);

      const outcome = await service.executeCollectionCycle({ force: true });

      expect(outcome.executed).toBe(true);
      expect(mockSourceManager.fetchJobsDetailed).toHaveBeenCalledTimes(1);
    });

    it('unconditionally releases advisory lock when harvest or processing throws', async () => {
      mockSourceManager.fetchJobsDetailed.mockRejectedValueOnce(new Error('Source engine crashed'));

      await expect(service.executeCollectionCycle()).rejects.toThrow('Source engine crashed');

      expect(mockAdvisoryLock.tryAcquire).toHaveBeenCalledTimes(1);
      expect(mockAdvisoryLock.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Collection Execution Metrics & Telemetry (TASK-26.2)', () => {
    it('tracks detailed counts for new jobs, existing updates, and dropped duplicates', async () => {
      const secondJob: Job = {
        ...sampleJob,
        title: 'Backend Developer (Updated)',
        applicationUrl: 'https://example.com/job/2',
      };
      const duplicateJob: Job = {
        ...sampleJob,
        title: 'Duplicate Listing',
      };

      mockSourceManager.fetchJobsDetailed.mockResolvedValueOnce({
        attempted: 5,
        succeeded: 4,
        failed: 1,
        jobs: [sampleJob, secondJob, duplicateJob],
        telemetry: [],
        durationMs: 300,
      });

      mockDeduplicationService.deduplicate.mockResolvedValueOnce({
        uniqueJobs: [sampleJob, secondJob],
        duplicateJobs: [duplicateJob],
      });

      // First job is new, second job is an update
      mockJobRepository.upsertJobWithResult
        .mockResolvedValueOnce({ job: sampleJob, isNew: true })
        .mockResolvedValueOnce({ job: secondJob, isNew: false });

      const outcome = await service.executeCollectionCycle();

      expect(outcome.executed).toBe(true);
      expect(outcome.stats).toBeDefined();
      expect(outcome.stats?.totalFetched).toBe(3);
      expect(outcome.stats?.duplicatesDropped).toBe(1);
      expect(outcome.stats?.newJobsInserted).toBe(1);
      expect(outcome.stats?.existingJobsUpdated).toBe(1);
      expect(outcome.stats?.sourcesAttempted).toBe(5);
      expect(outcome.stats?.sourcesFailed).toBe(1);

      // Verify stats are accessible via getLastStats()
      expect(service.getLastStats()).toEqual(outcome.stats);
      expect(outcome.stats?.sourcesBreakdown).toBeDefined();

      // Verify collection history tracking (ring buffer up to 10 entries)
      const history = service.getCollectionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].runId).toBe(outcome.stats?.runId);
    });

    it('limits collection history to the maximum 10 latest runs', async () => {
      service.clearHistoryForTesting();
      for (let i = 0; i < 15; i++) {
        await service.executeCollectionCycle();
      }

      const history = service.getCollectionHistory();
      expect(history).toHaveLength(10);
    });
  });

  describe('collectJobs - Backward Compatibility', () => {
    it('filters out invalid jobs and jobs older than cutoff', async () => {
      const oldJob: Job = {
        ...sampleJob,
        title: 'Old Job',
        publicationDate: new Date('2020-01-01'),
      };
      mockSourceManager.fetchJobs.mockResolvedValueOnce([sampleJob, oldJob]);

      const jobs = await service.collectJobs({ jobTitle: 'Backend' });

      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Senior Backend Engineer');
    });
  });
});
