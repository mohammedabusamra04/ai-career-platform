import { describe, expect, it } from 'vitest';
import {
  isValidExperienceLevel,
  isValidWorkType,
  normalizeJobTitle,
  normalizeLocation,
  normalizeSkills,
  validateJobTitle,
} from './preference.validator.js';
import { ExperienceLevel, WorkType } from '../../shared/types/job.js';

describe('PreferenceValidator', () => {
  describe('normalizeJobTitle', () => {
    it('should trim and collapse multiple consecutive whitespace characters', () => {
      expect(normalizeJobTitle('   Senior   Backend    Engineer   ')).toBe(
        'Senior Backend Engineer',
      );
    });

    it('should handle already trimmed strings', () => {
      expect(normalizeJobTitle('Frontend Developer')).toBe('Frontend Developer');
    });
  });

  describe('validateJobTitle', () => {
    it('should return true for valid job titles (2 to 100 characters)', () => {
      expect(validateJobTitle('AI')).toBe(true);
      expect(validateJobTitle('Software Engineer')).toBe(true);
      expect(validateJobTitle('A'.repeat(100))).toBe(true);
    });

    it('should return false for job titles shorter than 2 characters after normalization', () => {
      expect(validateJobTitle('')).toBe(false);
      expect(validateJobTitle('   ')).toBe(false);
      expect(validateJobTitle('A')).toBe(false);
      expect(validateJobTitle('  A  ')).toBe(false);
    });

    it('should return false for job titles longer than 100 characters', () => {
      expect(validateJobTitle('A'.repeat(101))).toBe(false);
    });
  });

  describe('isValidWorkType', () => {
    it('should return true for valid WorkType enum values', () => {
      expect(isValidWorkType(WorkType.REMOTE)).toBe(true);
      expect(isValidWorkType(WorkType.HYBRID)).toBe(true);
      expect(isValidWorkType(WorkType.ON_SITE)).toBe(true);
    });

    it('should return false for invalid work type strings', () => {
      expect(isValidWorkType('invalid')).toBe(false);
      expect(isValidWorkType('')).toBe(false);
      expect(isValidWorkType('remote_work')).toBe(false);
      expect(isValidWorkType('Remote')).toBe(false);
    });
  });

  describe('isValidExperienceLevel', () => {
    it('should return true for valid ExperienceLevel enum values', () => {
      expect(isValidExperienceLevel(ExperienceLevel.INTERN)).toBe(true);
      expect(isValidExperienceLevel(ExperienceLevel.JUNIOR)).toBe(true);
      expect(isValidExperienceLevel(ExperienceLevel.MID)).toBe(true);
      expect(isValidExperienceLevel(ExperienceLevel.SENIOR)).toBe(true);
      expect(isValidExperienceLevel(ExperienceLevel.LEAD)).toBe(true);
    });

    it('should return false for invalid experience levels', () => {
      expect(isValidExperienceLevel('invalid')).toBe(false);
      expect(isValidExperienceLevel('')).toBe(false);
      expect(isValidExperienceLevel('expert')).toBe(false);
    });
  });

  describe('normalizeLocation', () => {
    it('should return undefined when location is empty or whitespace', () => {
      expect(normalizeLocation('')).toBeUndefined();
      expect(normalizeLocation('   ')).toBeUndefined();
    });

    it('should return undefined when location is "any" (case-insensitive)', () => {
      expect(normalizeLocation('any')).toBeUndefined();
      expect(normalizeLocation('ANY')).toBeUndefined();
      expect(normalizeLocation('  Any  ')).toBeUndefined();
    });

    it('should normalize and return valid location string', () => {
      expect(normalizeLocation('  Gaza  , Palestine ')).toBe('Gaza , Palestine');
      expect(normalizeLocation('Dubai')).toBe('Dubai');
    });
  });

  describe('normalizeSkills', () => {
    it('should split comma-separated skills, trim items, and filter out empty strings', () => {
      expect(normalizeSkills('Node.js, TypeScript, , Redis,   Docker  , ')).toEqual([
        'Node.js',
        'TypeScript',
        'Redis',
        'Docker',
      ]);
    });

    it('should return an empty array for an empty or whitespace string', () => {
      expect(normalizeSkills('')).toEqual([]);
      expect(normalizeSkills('   ')).toEqual([]);
      expect(normalizeSkills(',,,')).toEqual([]);
    });

    it('should handle single skill without commas', () => {
      expect(normalizeSkills('Python')).toEqual(['Python']);
    });
  });
});
