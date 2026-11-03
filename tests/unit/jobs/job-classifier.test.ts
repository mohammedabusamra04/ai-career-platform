import { describe, it, expect } from 'vitest';
import {
  DeterministicJobClassifier,
  deterministicJobClassifier,
  NegativeExclusionMatcher,
  negativeExclusionMatcher,
} from '../../../src/modules/jobs/classifier/job.classifier.js';
import {
  Specialization,
  RemoteScope,
  ExperienceLevel,
  WorkType,
} from '@prisma/client';

describe('DeterministicJobClassifier - 10-Domain Specialization Classifier (TASK-26.1 / TASK-30)', () => {
  const classifier = deterministicJobClassifier;

  describe('Specialization Classification', () => {
    it('classifies AI / ML engineering jobs accurately', () => {
      const result = classifier.classify({
        title: 'Senior LLM & Machine Learning Engineer',
        skills: ['PyTorch', 'LangChain', 'Python'],
      });

      expect(result.primarySpecialization).toBe(Specialization.AI_ENGINEER);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Data engineering and analytics jobs', () => {
      const result = classifier.classify({
        title: 'Lead Data Engineer (ETL & Big Data)',
        skills: ['Spark', 'Airflow', 'Snowflake'],
      });

      expect(result.primarySpecialization).toBe(Specialization.DATA);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies DevOps and Cloud platform jobs', () => {
      const result = classifier.classify({
        title: 'Senior Site Reliability Engineer (SRE)',
        skills: ['Kubernetes', 'Terraform', 'AWS'],
      });

      expect(result.primarySpecialization).toBe(Specialization.DEVOPS);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Security and Cybersecurity jobs', () => {
      const result = classifier.classify({
        title: 'Application Security Engineer (AppSec)',
        skills: ['OWASP', 'Burp Suite'],
      });

      expect(result.primarySpecialization).toBe(Specialization.SECURITY);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies QA and Test Automation jobs', () => {
      const result = classifier.classify({
        title: 'Senior SDET / QA Automation Engineer',
        skills: ['Playwright', 'Cypress', 'Jest'],
      });

      expect(result.primarySpecialization).toBe(Specialization.QA);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Mobile development jobs', () => {
      const result = classifier.classify({
        title: 'Senior Flutter & iOS Mobile Developer',
        skills: ['Flutter', 'Swift', 'Dart'],
      });

      expect(result.primarySpecialization).toBe(Specialization.MOBILE);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies UI/UX and Product Design jobs', () => {
      const result = classifier.classify({
        title: 'Product Designer (UI/UX)',
        skills: ['Figma', 'Prototyping'],
      });

      expect(result.primarySpecialization).toBe(Specialization.UIUX);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Frontend web development jobs', () => {
      const result = classifier.classify({
        title: 'Senior React / Frontend Developer',
        skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'],
      });

      expect(result.primarySpecialization).toBe(Specialization.FRONTEND);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Full-Stack development jobs', () => {
      const result = classifier.classify({
        title: 'Full Stack Engineer (MERN)',
        skills: ['React', 'Node.js', 'MongoDB'],
      });

      expect(result.primarySpecialization).toBe(Specialization.FULLSTACK);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Backend engineering jobs as default technical baseline', () => {
      const result = classifier.classify({
        title: 'Senior Golang & Distributed Systems Engineer',
        skills: ['Go', 'PostgreSQL', 'Redis'],
      });

      expect(result.primarySpecialization).toBe(Specialization.BACKEND);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
    });

    it('classifies Rust backend jobs specifically (TASK-30.1)', () => {
      const result = classifier.classify({
        title: 'Senior Rust Systems & Backend Developer',
      });

      expect(result.primarySpecialization).toBe(Specialization.BACKEND);
      expect(result.confidence).toBe(0.95);
      expect(result.classificationMethod).toBe('RULE_TITLE');
      expect(result.matchedTokens).toContain('rust');
    });
  });

  describe('TASK-30.1: Title-First Tokenized Rule Engine (Trie / Map Keyword Sets)', () => {
    it('classifies directly from title with high confidence (0.95) and method RULE_TITLE', () => {
      const result = classifier.classifyTitle('Senior Backend Engineer (Node.js / Express)');

      expect(result).not.toBeNull();
      expect(result?.primarySpecialization).toBe(Specialization.BACKEND);
      expect(result?.confidence).toBe(0.95);
      expect(result?.classificationMethod).toBe('RULE_TITLE');
      expect(result?.matchedTokens.length).toBeGreaterThan(0);
    });

    it('handles special programming tokens correctly (.net, c#, c++, ui/ux, ci/cd)', () => {
      const csharp = classifier.classifyTitle('Lead C# / .NET Web Developer');
      expect(csharp?.primarySpecialization).toBe(Specialization.BACKEND);

      const uiux = classifier.classifyTitle('Senior UI/UX Designer & Researcher');
      expect(uiux?.primarySpecialization).toBe(Specialization.UIUX);

      const devops = classifier.classifyTitle('DevOps & CI/CD Platform Engineer');
      expect(devops?.primarySpecialization).toBe(Specialization.DEVOPS);
    });

    it('supports Arabic titles natively across specializations', () => {
      const frontend = classifier.classifyTitle('مطور واجهات أمامية محترف');
      expect(frontend?.primarySpecialization).toBe(Specialization.FRONTEND);

      const backend = classifier.classifyTitle('مهندس خلفية النظم والبيانات');
      expect(backend?.primarySpecialization).toBe(Specialization.BACKEND);

      const ai = classifier.classifyTitle('مهندس ذكاء اصطناعي وتعلم الآلة');
      expect(ai?.primarySpecialization).toBe(Specialization.AI_ENGINEER);

      const security = classifier.classifyTitle('أخصائي أمن سيبراني ومعلومات');
      expect(security?.primarySpecialization).toBe(Specialization.SECURITY);
    });

    it('returns null for unclassifiable or ambiguous titles without throwing', () => {
      expect(classifier.classifyTitle('')).toBeNull();
      expect(classifier.classifyTitle('   ')).toBeNull();
      expect(classifier.classifyTitle('General Operational Lead')).toBeNull();
      expect(classifier.classifyTitle('Project Coordinator')).toBeNull();
    });

    it('satisfies execution speed requirement (<0.1ms per title)', () => {
      const sampleTitles = [
        'Senior Backend Developer (Node.js & Postgres)',
        'Frontend React Engineer (Next.js & Tailwind)',
        'Senior DevOps & SRE Specialist (Kubernetes)',
        'Full Stack Software Developer (MERN Stack)',
        'Lead Data Engineer (Spark & Airflow)',
      ];

      const iterations = 500;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const title = sampleTitles[i % sampleTitles.length];
        classifier.classifyTitle(title);
      }

      const totalTimeMs = performance.now() - start;
      const avgTimePerTitleMs = totalTimeMs / iterations;

      expect(avgTimePerTitleMs).toBeLessThan(0.1);
    });
  });

  describe('TASK-30.2: Explicit Exclusion Negative Matcher (#92)', () => {
    const exclusionMatcher = negativeExclusionMatcher;

    it('evaluates exclusion directly via NegativeExclusionMatcher standalone', () => {
      const res = exclusionMatcher.evaluate('QA Recruitment Consultant');
      expect(res.isExcluded).toBe(true);
      expect(res.matchedPattern).toBe('recruiter');
    });

    it('rejects QA Recruitment Consultant as NON_TECHNICAL / excluded (Test Spec #92)', () => {
      const result = classifier.classify({
        title: 'QA Recruitment Consultant',
        skills: ['QA', 'Testing'],
      });

      expect(result.isExcluded).toBe(true);
      expect(result.primarySpecialization).toBeNull();
      expect(result.classificationMethod).toBe('NEGATIVE_EXCLUSION');
      expect(result.confidence).toBe(1.0);
    });

    it('rejects Software Sales Account Executive as NON_TECHNICAL / excluded (Test Spec #92)', () => {
      const result = classifier.classify({
        title: 'Software Sales Account Executive',
        skills: ['Sales', 'SaaS'],
      });

      expect(result.isExcluded).toBe(true);
      expect(result.primarySpecialization).toBeNull();
      expect(result.classificationMethod).toBe('NEGATIVE_EXCLUSION');
    });

    it('rejects DevOps Sales Manager despite containing DevOps keyword', () => {
      const result = classifier.classify({
        title: 'DevOps Sales Manager',
      });

      expect(result.isExcluded).toBe(true);
      expect(result.classificationMethod).toBe('NEGATIVE_EXCLUSION');
    });

    it('rejects Technical Recruiter and Headhunter roles', () => {
      const rec = classifier.classify({ title: 'Technical Recruiter (IT & Software)' });
      expect(rec.isExcluded).toBe(true);

      const talent = classifier.classify({ title: 'Talent Acquisition Specialist (Engineering)' });
      expect(talent.isExcluded).toBe(true);
    });

    it('rejects Customer Support and Executive Assistant roles', () => {
      const support = classifier.classify({ title: 'Customer Support Specialist (Technical Tier 1)' });
      expect(support.isExcluded).toBe(true);

      const ea = classifier.classify({ title: 'Executive Assistant to VP of Engineering' });
      expect(ea.isExcluded).toBe(true);
    });

    it('rejects Content Writer and Copywriter roles', () => {
      const writer = classifier.classify({ title: 'Technical Content Writer & Copywriter' });
      expect(writer.isExcluded).toBe(true);
    });

    it('rejects Arabic non-technical roles', () => {
      const hr = classifier.classify({ title: 'مسؤول توظيف تقني وموارد بشرية' });
      expect(hr.isExcluded).toBe(true);

      const sales = classifier.classify({ title: 'مندوب مبيعات برمجيات سحابية' });
      expect(sales.isExcluded).toBe(true);

      const cs = classifier.classify({ title: 'أخصائي خدمة عملاء ودعم فني' });
      expect(cs.isExcluded).toBe(true);
    });

    it('prevents positive title classification from matching excluded roles', () => {
      expect(classifier.classifyTitle('QA Recruitment Consultant')).toBeNull();
      expect(classifier.classifyTitle('DevOps Sales Manager')).toBeNull();
      expect(classifier.classifyTitle('Technical Recruiter')).toBeNull();
    });

    it('does NOT exclude legitimate engineering titles containing test/sales/support context', () => {
      const qa = classifier.classify({ title: 'QA Automation Engineer' });
      expect(qa.isExcluded).toBe(false);
      expect(qa.primarySpecialization).toBe(Specialization.QA);

      const devops = classifier.classify({ title: 'Senior DevOps Engineer' });
      expect(devops.isExcluded).toBe(false);
      expect(devops.primarySpecialization).toBe(Specialization.DEVOPS);

      const backend = classifier.classify({ title: 'Backend Software Engineer' });
      expect(backend.isExcluded).toBe(false);
      expect(backend.primarySpecialization).toBe(Specialization.BACKEND);
    });
  });

  describe('TASK-30.1: 100-Job Benchmark Fixture Suite (>= 90% Accuracy Acceptance Criterion)', () => {
    interface BenchmarkCase {
      title: string;
      expected: Specialization;
    }

    const BENCHMARK_100_TITLES: BenchmarkCase[] = [
      // 1. BACKEND (10)
      { title: 'Senior Node.js Backend Engineer', expected: Specialization.BACKEND },
      { title: 'Lead Rust Systems Engineer', expected: Specialization.BACKEND },
      { title: 'Golang Developer (Microservices)', expected: Specialization.BACKEND },
      { title: 'Senior Python & Django Developer', expected: Specialization.BACKEND },
      { title: 'C# / .NET Core Web API Engineer', expected: Specialization.BACKEND },
      { title: 'Java Spring Boot Software Engineer', expected: Specialization.BACKEND },
      { title: 'PHP / Laravel Backend Developer', expected: Specialization.BACKEND },
      { title: 'Ruby on Rails Developer', expected: Specialization.BACKEND },
      { title: 'مطور خلفي (Node.js & PostgreSQL)', expected: Specialization.BACKEND },
      { title: 'مهندس برمجيات باك اند (Go / Docker)', expected: Specialization.BACKEND },

      // 2. FRONTEND (10)
      { title: 'Senior React.js Frontend Engineer', expected: Specialization.FRONTEND },
      { title: 'Vue.js Web Application Developer', expected: Specialization.FRONTEND },
      { title: 'Angular 17 Frontend Developer', expected: Specialization.FRONTEND },
      { title: 'Next.js & TypeScript UI Developer', expected: Specialization.FRONTEND },
      { title: 'Lead Frontend Developer (Tailwind CSS)', expected: Specialization.FRONTEND },
      { title: 'Nuxt.js Web Developer', expected: Specialization.FRONTEND },
      { title: 'Svelte & SvelteKit Web Engineer', expected: Specialization.FRONTEND },
      { title: 'مطور واجهات أمامية (React / Redux)', expected: Specialization.FRONTEND },
      { title: 'مهندس واجهات مستخدم (Vue / Tailwind)', expected: Specialization.FRONTEND },
      { title: 'فرونت اند ديفلوبر (Angular)', expected: Specialization.FRONTEND },

      // 3. FULLSTACK (10)
      { title: 'Senior Full Stack Developer (React / Node)', expected: Specialization.FULLSTACK },
      { title: 'Lead Full-Stack Engineer (Next.js & NestJS)', expected: Specialization.FULLSTACK },
      { title: 'Fullstack Web Developer (MERN Stack)', expected: Specialization.FULLSTACK },
      { title: 'MEAN Stack Engineer', expected: Specialization.FULLSTACK },
      { title: 'Staff Full Stack Software Engineer', expected: Specialization.FULLSTACK },
      { title: 'Junior Full-Stack Developer', expected: Specialization.FULLSTACK },
      { title: 'Full Stack JavaScript Developer', expected: Specialization.FULLSTACK },
      { title: 'مطور شامل (Full Stack Developer)', expected: Specialization.FULLSTACK },
      { title: 'مهندس برمجيات فول ستاك', expected: Specialization.FULLSTACK },
      { title: 'مطور ويب شامل (MERN)', expected: Specialization.FULLSTACK },

      // 4. MOBILE (10)
      { title: 'Senior Flutter Mobile Developer', expected: Specialization.MOBILE },
      { title: 'Lead React Native Engineer', expected: Specialization.MOBILE },
      { title: 'Native iOS Developer (Swift & SwiftUI)', expected: Specialization.MOBILE },
      { title: 'Android Application Engineer (Kotlin)', expected: Specialization.MOBILE },
      { title: 'Cross-Platform Mobile Engineer (Flutter)', expected: Specialization.MOBILE },
      { title: 'Staff iOS Mobile Engineer', expected: Specialization.MOBILE },
      { title: 'Junior Android Developer', expected: Specialization.MOBILE },
      { title: 'مطور تطبيقات جوال (Flutter)', expected: Specialization.MOBILE },
      { title: 'مهندس تطبيقات ايفون (iOS / Swift)', expected: Specialization.MOBILE },
      { title: 'مطور تطبيقات موبايل (React Native)', expected: Specialization.MOBILE },

      // 5. DEVOPS (10)
      { title: 'Senior DevOps Engineer (AWS & Kubernetes)', expected: Specialization.DEVOPS },
      { title: 'Lead Site Reliability Engineer (SRE)', expected: Specialization.DEVOPS },
      { title: 'Cloud Infrastructure Engineer (Terraform)', expected: Specialization.DEVOPS },
      { title: 'Platform Engineer (Docker & K8s)', expected: Specialization.DEVOPS },
      { title: 'DevOps & CI/CD Automation Specialist', expected: Specialization.DEVOPS },
      { title: 'Senior Systems Administrator (SysAdmin)', expected: Specialization.DEVOPS },
      { title: 'Cloud Architect & DevOps Consultant', expected: Specialization.DEVOPS },
      { title: 'مهندس سحابي (Cloud & DevOps)', expected: Specialization.DEVOPS },
      { title: 'مهندس بنية تحتية سحابية (Kubernetes)', expected: Specialization.DEVOPS },
      { title: 'ديف اوبس انجنير (AWS / Terraform)', expected: Specialization.DEVOPS },

      // 6. UIUX (10)
      { title: 'Senior UI/UX Designer', expected: Specialization.UIUX },
      { title: 'Lead Product Designer (Figma)', expected: Specialization.UIUX },
      { title: 'UX/UI Designer & Prototyper', expected: Specialization.UIUX },
      { title: 'User Experience Researcher & Designer', expected: Specialization.UIUX },
      { title: 'Visual UI Designer (Design Systems)', expected: Specialization.UIUX },
      { title: 'Interaction Designer (Web & Mobile)', expected: Specialization.UIUX },
      { title: 'Staff Product Designer (UX/UI)', expected: Specialization.UIUX },
      { title: 'مصمم واجهات وتجربة المستخدم (UI/UX)', expected: Specialization.UIUX },
      { title: 'مصمم منتجات رقمية (Figma / UI)', expected: Specialization.UIUX },
      { title: 'أخصائي تجربة المستخدم (UX Designer)', expected: Specialization.UIUX },

      // 7. DATA (10)
      { title: 'Senior Data Engineer (Spark & Airflow)', expected: Specialization.DATA },
      { title: 'Lead Data Analyst (Tableau & Power BI)', expected: Specialization.DATA },
      { title: 'Data Scientist (Predictive Analytics)', expected: Specialization.DATA },
      { title: 'Business Intelligence (BI) Engineer', expected: Specialization.DATA },
      { title: 'Analytics Engineer (dbt & Snowflake)', expected: Specialization.DATA },
      { title: 'Senior SQL Database Developer', expected: Specialization.DATA },
      { title: 'ETL Data Pipeline Engineer', expected: Specialization.DATA },
      { title: 'مهندس بيانات ضخمة (Big Data)', expected: Specialization.DATA },
      { title: 'محلل بيانات أول (Data Analyst)', expected: Specialization.DATA },
      { title: 'أخصائي علم البيانات والذكاء التجاري', expected: Specialization.DATA },

      // 8. QA (10)
      { title: 'Senior QA Automation Engineer (Playwright)', expected: Specialization.QA },
      { title: 'Lead Software Development Engineer in Test (SDET)', expected: Specialization.QA },
      { title: 'Quality Assurance Specialist (Cypress)', expected: Specialization.QA },
      { title: 'Manual & Automation Test Engineer', expected: Specialization.QA },
      { title: 'Senior Selenium Automation Tester', expected: Specialization.QA },
      { title: 'Mobile QA Engineer (Appium)', expected: Specialization.QA },
      { title: 'Performance & QC Test Engineer', expected: Specialization.QA },
      { title: 'مهندس فحص جودة البرمجيات (QA Engineer)', expected: Specialization.QA },
      { title: 'فاحص برمجيات آلي (Test Automation)', expected: Specialization.QA },
      { title: 'أخصائي ضمان الجودة (Software Testing)', expected: Specialization.QA },

      // 9. SECURITY (10)
      { title: 'Senior Cybersecurity Engineer', expected: Specialization.SECURITY },
      { title: 'Lead Information Security Analyst (InfoSec)', expected: Specialization.SECURITY },
      { title: 'Application Security Engineer (AppSec)', expected: Specialization.SECURITY },
      { title: 'Penetration Tester (Ethical Hacker)', expected: Specialization.SECURITY },
      { title: 'SOC Analyst (Level 2)', expected: Specialization.SECURITY },
      { title: 'Cloud Security Engineer (SIEM / OWASP)', expected: Specialization.SECURITY },
      { title: 'Vulnerability Assessment & Pentester', expected: Specialization.SECURITY },
      { title: 'مهندس أمن سيبراني (Cybersecurity)', expected: Specialization.SECURITY },
      { title: 'محلل أمن معلومات (InfoSec Analyst)', expected: Specialization.SECURITY },
      { title: 'مختبر اختراق أمني (Penetration Tester)', expected: Specialization.SECURITY },

      // 10. AI_ENGINEER (10)
      { title: 'Senior AI Engineer (LLMs & Generative AI)', expected: Specialization.AI_ENGINEER },
      { title: 'Lead Machine Learning Engineer (MLOps)', expected: Specialization.AI_ENGINEER },
      { title: 'Deep Learning & Computer Vision Scientist', expected: Specialization.AI_ENGINEER },
      { title: 'Natural Language Processing (NLP) Engineer', expected: Specialization.AI_ENGINEER },
      { title: 'AI Developer (LangChain & PyTorch)', expected: Specialization.AI_ENGINEER },
      { title: 'Prompt Engineer & LLM Specialist', expected: Specialization.AI_ENGINEER },
      { title: 'Artificial Intelligence Research Engineer', expected: Specialization.AI_ENGINEER },
      { title: 'مهندس ذكاء اصطناعي (AI Engineer)', expected: Specialization.AI_ENGINEER },
      { title: 'مهندس تعلم الآلة (Machine Learning)', expected: Specialization.AI_ENGINEER },
      { title: 'مطور نماذج لغوية (LLM & GenAI Developer)', expected: Specialization.AI_ENGINEER },
    ];

    it('verifies exact benchmark suite contains 100 job titles', () => {
      expect(BENCHMARK_100_TITLES.length).toBe(100);
    });

    it('achieves >= 90% accuracy on the 100 benchmark job titles', () => {
      let correctMatches = 0;
      const failedMatches: Array<{ title: string; expected: Specialization; actual: Specialization | null }> = [];

      for (const item of BENCHMARK_100_TITLES) {
        const result = classifier.classifyTitle(item.title);
        const actual = result?.primarySpecialization ?? null;

        if (actual === item.expected) {
          correctMatches++;
        } else {
          failedMatches.push({ title: item.title, expected: item.expected, actual });
        }
      }

      const accuracyPercentage = (correctMatches / BENCHMARK_100_TITLES.length) * 100;

      if (failedMatches.length > 0) {
        console.warn(`Failed benchmark cases (${failedMatches.length}):`, failedMatches);
      }

      expect(accuracyPercentage).toBeGreaterThanOrEqual(90);
      expect(accuracyPercentage).toBe(100);
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
