import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import {
  PrismaSentJobRepository,
  type DeliveryRecordInput,
} from '../../../src/modules/notifications/index.js';

describe('PrismaSentJobRepository - High-Throughput Delivery History Storage (TASK-23.1)', () => {
  let mockPrisma: any;
  let repository: PrismaSentJobRepository;

  beforeEach(() => {
    mockPrisma = {
      sentJob: {
        createMany: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    repository = new PrismaSentJobRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('recordBatchSent', () => {
    it('records batch of deliveries with skipDuplicates: true for idempotency', async () => {
      const fixedDate = new Date('2026-10-27T10:00:00Z');
      const deliveries: DeliveryRecordInput[] = [
        { userId: 'u1', jobId: 'j1', sentAt: fixedDate },
        { userId: 'u1', jobId: 'j2', sentAt: fixedDate },
        { userId: 'u2', jobId: 'j1', sentAt: fixedDate },
      ];

      mockPrisma.sentJob.createMany.mockResolvedValue({ count: 3 });

      await repository.recordBatchSent(deliveries);

      expect(mockPrisma.sentJob.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'u1', jobId: 'j1', sentAt: fixedDate, feedback: 'NONE' },
          { userId: 'u1', jobId: 'j2', sentAt: fixedDate, feedback: 'NONE' },
          { userId: 'u2', jobId: 'j1', sentAt: fixedDate, feedback: 'NONE' },
        ],
        skipDuplicates: true,
      });
    });

    it('handles empty deliveries array without executing query', async () => {
      await repository.recordBatchSent([]);

      expect(mockPrisma.sentJob.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getSentJobIdsForUser', () => {
    it('returns a Set of job IDs sent to the specified user', async () => {
      mockPrisma.sentJob.findMany.mockResolvedValue([
        { jobId: 'job-1' },
        { jobId: 'job-2' },
      ]);

      const sentSet = await repository.getSentJobIdsForUser('user-1');

      expect(mockPrisma.sentJob.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { jobId: true },
      });
      expect(sentSet).toBeInstanceOf(Set);
      expect(sentSet.size).toBe(2);
      expect(sentSet.has('job-1')).toBe(true);
      expect(sentSet.has('job-2')).toBe(true);
      expect(sentSet.has('job-3')).toBe(false);
    });

    it('returns empty Set when user has no sent history', async () => {
      mockPrisma.sentJob.findMany.mockResolvedValue([]);

      const sentSet = await repository.getSentJobIdsForUser('new-user');

      expect(sentSet.size).toBe(0);
    });
  });

  describe('isJobSentToUser', () => {
    it('returns true when job has been sent to user via composite key lookup', async () => {
      mockPrisma.sentJob.findUnique.mockResolvedValue({ id: 'sent-uuid-1' });

      const result = await repository.isJobSentToUser('user-1', 'job-1');

      expect(mockPrisma.sentJob.findUnique).toHaveBeenCalledWith({
        where: {
          userId_jobId: {
            userId: 'user-1',
            jobId: 'job-1',
          },
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when job has not been sent to user', async () => {
      mockPrisma.sentJob.findUnique.mockResolvedValue(null);

      const result = await repository.isJobSentToUser('user-1', 'job-999');

      expect(result).toBe(false);
    });
  });

  describe('filterUnsentJobsForUser', () => {
    it('excludes job J1 for user U1 after it was recorded as sent, but retains J1 for user U2', async () => {
      // Mock sent jobs query for user U1
      mockPrisma.sentJob.findMany.mockImplementation(async (args: any) => {
        if (args.where.userId === 'user-1') {
          return [{ jobId: 'job-1' }];
        }
        if (args.where.userId === 'user-2') {
          return []; // Nothing sent to user-2 yet
        }
        return [];
      });

      const candidateJobs = ['job-1', 'job-2', 'job-3'];

      const unsentForU1 = await repository.filterUnsentJobsForUser('user-1', candidateJobs);
      expect(unsentForU1).toEqual(['job-2', 'job-3']); // job-1 excluded

      const unsentForU2 = await repository.filterUnsentJobsForUser('user-2', candidateJobs);
      expect(unsentForU2).toEqual(['job-1', 'job-2', 'job-3']); // job-1 included
    });

    it('returns empty array when candidate list is empty', async () => {
      const result = await repository.filterUnsentJobsForUser('user-1', []);
      expect(result).toEqual([]);
      expect(mockPrisma.sentJob.findMany).not.toHaveBeenCalled();
    });
  });

  describe('countSentJobs & deleteSentHistoryForUser', () => {
    it('counts all sent jobs or filters by userId', async () => {
      mockPrisma.sentJob.count.mockResolvedValue(100);

      const totalCount = await repository.countSentJobs();
      expect(mockPrisma.sentJob.count).toHaveBeenCalledWith({ where: undefined });
      expect(totalCount).toBe(100);

      await repository.countSentJobs('user-1');
      expect(mockPrisma.sentJob.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('deletes sent history for a given userId', async () => {
      mockPrisma.sentJob.deleteMany.mockResolvedValue({ count: 5 });

      await repository.deleteSentHistoryForUser('user-1');

      expect(mockPrisma.sentJob.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
