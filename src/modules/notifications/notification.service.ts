import type { MatchedJob } from '../matching/matching.service.js';

export interface NotificationService {
  sendJob(chatId: number, matchedJob: MatchedJob): Promise<void>;
  sendJobs(chatId: number, matchedJobs: MatchedJob[]): Promise<void>;
}
