import type { Job } from '../jobs/job.types.js';
import type { UserPreferences } from '../preferences/preference.types.js';

export interface MatchingInput {
  preferences: UserPreferences;
  job: Job;
}

export interface MatchingResult {
  score: number;
  reason: string;
}
