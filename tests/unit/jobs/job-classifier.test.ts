import { describe, it, expect } from 'vitest';
import {
  DeterministicJobClassifier,
  deterministicJobClassifier,
} from '../../../src/modules/jobs/classifier/job.classifier.js';
import {
  Specialization,
  RemoteScope,
  ExperienceLevel,
  WorkType,
} from '@prisma/client';
import { JobSourceType } from '../../../src/modules/jobs/job.types.js';

describe('DeterministicJobClassifier - 10-Domain Specialization Classifier (TASK-26.1 / TASK-30)', () => {
  const classifier = deterministicJobClassifier;

  describe('Specialization Classification', () => {
    it('classifies AI / ML engineering jobs accurately', () => {
      const result = classifier.classify({
        title: 'Senior LLM & Machine Learning Engineer',
        skills: ['PyTorch', 'LangChain', 'Python'],
      });

      expect(result.primarySpecialization).toBe(Specialization.AI_ENGINEER);
    });

    it('classifies Data engineering and analytics jobs', () => {
      const result = classifier.classify({
        title: 'Lead Data Engineer (ETL & Big Data)',
        skills: ['Spark', 'Airflow', 'Snowflake'],
      });

      expect(result.primarySpecialization).toBe(Specialization.DATA);
    });

    it('classifies DevOps and Cloud platform jobs', () => {
      const result = classifier.classify({
        title: 'Senior Site Reliability Engineer (SRE)',
        skills: ['Kubernetes', 'Terraform', 'AWS'],
      });

      expect(result.primarySpecialization).toBe(Specialization.DEVOPS);
    });

    it('classifies Security and Cybersecurity jobs', () => {
      const result = classifier.classify({
        title: 'Application Security Engineer (AppSec)',
        skills: ['OWASP', 'Burp Suite'],
      });

      expect(result.primarySpecialization).toBe(Specialization.SECURITY);
    });

    it('classifies QA and Test Automation jobs', () => {
      const result = classifier.classify({
        title: 'Senior SDET / QA Automation Engineer',
        skills: ['Playwright', 'Cypress', 'Jest'],
      });

      expect(result.primarySpecialization).toBe(Specialization.QA);
    });

    it('classifies Mobile development jobs', () => {
      const result = classifier.classify({
        title: 'Senior Flutter & iOS Mobile Developer',
        skills: ['Flutter', 'Swift', 'Dart'],
      });

      expect(result.primarySpecialization).toBe(Specialization.MOBILE);
    });

    it('classifies UI/UX and Product Design jobs', () => {
      const result = classifier.classify({
        title: 'Product Designer (UI/UX)',
        skills: ['Figma', 'Prototyping'],
      });

      expect(result.primarySpecialization).toBe(Specialization.UIUX);
    });

    it('classifies Frontend web development jobs', () => {
      const result = classifier.classify({
        title: 'Senior React / Frontend Developer',
        skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'],
      });

      expect(result.primarySpecialization).toBe(Specialization.FRONTEND);
    });

    it('classifies Full-Stack development jobs', () => {
      const result = classifier.classify({
        title: 'Full Stack Engineer (MERN)',
        skills: ['React', 'Node.js', 'MongoDB'],
      });

      expect(result.primarySpecialization).toBe(Specialization.FULLSTACK);
    });

    it('classifies Backend engineering jobs as default technical baseline', () => {
      const result = classifier.classify({
        title: 'Senior Golang & Distributed Systems Engineer',
        skills: ['Go', 'PostgreSQL', 'Redis'],
      });

      expect(result.primarySpecialization).toBe(Specialization.BACKEND);
    });
  });

  describe('Remote Scope Resolution', () => {
    it('detects Worldwide remote scope from explicit keywords', () => {
      const result = classifier.classify({
        title: 'Software Engineer (Worldwide Remote)',
        location: 'Anywhere',
      });

      expect(result.remoteScope).toBe(RemoteScope.WORLDWIDE);
    });

    it('detects Region remote scope for MENA / GCC / Arab regions', () => {
      const result = classifier.classify({
        title: 'Backend Engineer',
        location: 'MENA Region (Remote)',
      });

      expect(result.remoteScope).toBe(RemoteScope.REGION);
    });

    it('detects Country remote scope when country or city is specified', () => {
      const result = classifier.classify({
        title: 'Frontend Developer',
        country: 'Egypt',
        location: 'Cairo, Egypt',
      });

      expect(result.remoteScope).toBe(RemoteScope.COUNTRY);
    });

    it('falls back to Worldwide if remote flag is true without restrictions', () => {
      const result = classifier.classify({
        title: 'Fullstack Developer',
        remote: true,
      });

      expect(result.remoteScope).toBe(RemoteScope.WORLDWIDE);
    });
  });

  describe('Experience Level and Work Type Resolution', () => {
    it('detects Senior level from title', () => {
      const result = classifier.classify({
        title: 'Senior Software Engineer',
      });

      expect(result.experienceLevel).toBe(ExperienceLevel.SENIOR);
    });

    it('detects Junior / Entry level from title', () => {
      const result = classifier.classify({
        title: 'Junior Web Developer (Fresh Graduate)',
      });

      expect(result.experienceLevel).toBe(ExperienceLevel.JUNIOR);
    });

    it('detects Contract work type from keywords', () => {
      const result = classifier.classify({
        title: 'Backend Developer (Freelance / Contract)',
      });

      expect(result.workType).toBe(WorkType.CONTRACT);
    });

    it('detects Full Time work type as standard default', () => {
      const result = classifier.classify({
        title: 'Backend Developer (Full-Time)',
      });

      expect(result.workType).toBe(WorkType.FULL_TIME);
    });
  });
});
