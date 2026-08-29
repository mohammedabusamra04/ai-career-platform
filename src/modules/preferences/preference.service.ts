import { AppError } from '../../shared/errors/AppError.js';

import type { ExperienceLevel, JobPreferences, WorkType } from './preference.types.js';

import {
  isValidExperienceLevel,
  isValidWorkType,
  normalizeJobTitle,
  normalizeLocation,
  normalizeSkills,
  validateJobTitle,
} from './preference.validator.js';

export class PreferenceService {
  createPreferences(input: {
    jobTitle: string;
    workType: string;
    experienceLevel: string;
    location?: string;
    skills?: string;
  }): JobPreferences {
    const jobTitle = normalizeJobTitle(input.jobTitle);

    if (!validateJobTitle(jobTitle)) {
      throw AppError.badRequest('Invalid job title');
    }

    if (!isValidWorkType(input.workType)) {
      throw AppError.badRequest('Invalid work type');
    }

    if (!isValidExperienceLevel(input.experienceLevel)) {
      throw AppError.badRequest('Invalid experience level');
    }

    return {
      jobTitle,
      workType: input.workType as WorkType,
      experienceLevel: input.experienceLevel as ExperienceLevel,
      location: input.location ? normalizeLocation(input.location) : undefined,
      skills: input.skills ? normalizeSkills(input.skills) : undefined,
    };
  }
}

export const preferenceService = new PreferenceService();
