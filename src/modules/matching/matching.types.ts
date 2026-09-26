import type { Job } from '../jobs/job.types.js';
import type { UserPreferences } from '../preferences/preference.types.js';
import type { WorkType, ExperienceLevel } from '../../shared/types/job.js';

export interface MatchingInput {
  preferences: UserPreferences;
  job: Job;
}

export interface MatchingResult {
  score: number;
  reason: string;
}

export interface JobAnalysis {
  role: string;
  level: ExperienceLevel | string;
  skills: string[];
  workType: WorkType | string;
}

export interface JobAnalysisInput {
  job: Job;
}

export interface JobAnalysisResult {
  role: string;
  skills: string[];
  experienceLevel: ExperienceLevel | string;
  workType: WorkType;
  summary: string;
}