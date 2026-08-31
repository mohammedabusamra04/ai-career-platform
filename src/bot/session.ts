import type { UserPreferences } from '../modules/preferences/preference.types.js';

export type PreferenceStep =
  'job-title' | 'work-type' | 'experience-level' | 'location' | 'skills' | 'confirmation';

export interface PreferenceSession {
  step: PreferenceStep;
  preferences: Partial<UserPreferences>;
}
