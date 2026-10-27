import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../shared/database/prisma.service.js';
import type {
  ISentJobRepository,
  DeliveryRecordInput,
} from './sent-job.repository.interface.js';

export class PrismaSentJobRepository implements ISentJobRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  public async recordBatchSent(deliveries: DeliveryRecordInput[]): Promise<void> {
    if (!deliveries || deliveries.length === 0) {
      return;
    }

    const data = deliveries.map((d) => ({
      userId: d.userId,
      jobId: d.jobId,
      sentAt: d.sentAt ?? new Date(),
      feedback: d.feedback ?? 'NONE',
    }));

    await this.db.sentJob.createMany({
      data,
      skipDuplicates: true,
    });
  }

  public async getSentJobIdsForUser(userId: string): Promise<Set<string>> {
    const records = await this.db.sentJob.findMany({
      where: { userId },
      select: { jobId: true },
    });

    return new Set(records.map((r) => r.jobId));
  }

  public async isJobSentToUser(userId: string, jobId: string): Promise<boolean> {
    const record = await this.db.sentJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      select: { id: true },
    });

    return Boolean(record);
  }

  public async filterUnsentJobsForUser(
    userId: string,
    candidateJobIds: string[],
  ): Promise<string[]> {
    if (!candidateJobIds || candidateJobIds.length === 0) {
      return [];
    }

    const sentRecords = await this.db.sentJob.findMany({
      where: {
        userId,
        jobId: {
          in: candidateJobIds,
        },
      },
      select: { jobId: true },
    });

    const sentSet = new Set(sentRecords.map((r) => r.jobId));
    return candidateJobIds.filter((jobId) => !sentSet.has(jobId));
  }

  public async countSentJobs(userId?: string): Promise<number> {
    return this.db.sentJob.count({
      where: userId ? { userId } : undefined,
    });
  }

  public async deleteSentHistoryForUser(userId: string): Promise<void> {
    await this.db.sentJob.deleteMany({
      where: { userId },
    });
  }
}

export const sentJobRepository = new PrismaSentJobRepository();
