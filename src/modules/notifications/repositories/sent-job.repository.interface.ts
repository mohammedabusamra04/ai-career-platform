import type { FeedbackType } from '@prisma/client';

export interface SentJobEntity {
  id: string;
  userId: string;
  jobId: string;
  sentAt: Date;
  feedback: FeedbackType;
}

export interface DeliveryRecordInput {
  userId: string;
  jobId: string;
  sentAt?: Date;
  feedback?: FeedbackType;
}

export interface ISentJobRepository {
  recordBatchSent(deliveries: DeliveryRecordInput[]): Promise<void>;
  getSentJobIdsForUser(userId: string): Promise<Set<string>>;
  isJobSentToUser(userId: string, jobId: string): Promise<boolean>;
  filterUnsentJobsForUser(userId: string, candidateJobIds: string[]): Promise<string[]>;
  countSentJobs(userId?: string): Promise<number>;
  deleteSentHistoryForUser(userId: string): Promise<void>;
}
