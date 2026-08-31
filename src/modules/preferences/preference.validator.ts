import { ExperienceLevel, WorkType } from './preference.types.js';

export function normalizeJobTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateJobTitle(value: string): boolean {
  const normalized = normalizeJobTitle(value);

  return normalized.length >= 2 && normalized.length <= 100;
}

export function isValidWorkType(value: string): value is WorkType {
  return Object.values(WorkType).includes(value as WorkType);
}

export function isValidExperienceLevel(value: string): value is ExperienceLevel {
  return Object.values(ExperienceLevel).includes(value as ExperienceLevel);
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
