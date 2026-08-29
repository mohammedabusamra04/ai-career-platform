import type { ExperienceLevel, WorkType } from './preference.types.js';

const WORK_TYPES: readonly WorkType[] = ['remote', 'hybrid', 'on-site', 'any'];

const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'any',
];

export function normalizeJobTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateJobTitle(value: string): boolean {
  const normalized = normalizeJobTitle(value);

  return normalized.length >= 2 && normalized.length <= 100;
}

export function isValidWorkType(value: string): value is WorkType {
  return WORK_TYPES.includes(value as WorkType);
}

export function isValidExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_LEVELS.includes(value as ExperienceLevel);
}

export function normalizeLocation(value: string): string | undefined {
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (!normalized || normalized.toLowerCase() === 'any') {
    return undefined;
  }

  return normalized;
}

export function normalizeSkills(value: string): string[] {
  return value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
}
