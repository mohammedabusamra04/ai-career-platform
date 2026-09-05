import type { MatchedJob } from '../matching/matching.service.js';

export interface JobNotification {
  chatId: number;
  matchedJob: MatchedJob;
}
