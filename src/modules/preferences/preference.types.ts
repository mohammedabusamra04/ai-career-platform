import { WorkType, ExperienceLevel } from '../../shared/types/job.js';

export interface UserPreferences {
  jobTitle: string;
  workType: WorkType;
  experienceLevel: ExperienceLevel;
  location?: string;
  skills?: string[];
  timezone: string;
  notificationTimes: string[];
}
