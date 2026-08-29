export type WorkType = 'remote' | 'hybrid' | 'on-site' | 'any';

export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'any';

export interface JobPreferences {
  jobTitle: string;
  workType: WorkType;
  experienceLevel: ExperienceLevel;
  location?: string;
  skills?: string[];
}
