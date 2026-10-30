import {
  Specialization,
  RemoteScope,
  ExperienceLevel,
  WorkType,
} from '@prisma/client';
import type { Job } from '../job.types.js';

export interface ClassificationResult {
  primarySpecialization: Specialization;
  secondarySpecialization: Specialization | null;
  remoteScope: RemoteScope;
  experienceLevel: ExperienceLevel;
  workType: WorkType;
}

export class DeterministicJobClassifier {
  private static readonly SPECIALIZATION_RULES: Array<{
    spec: Specialization;
    titleRegex: RegExp;
    skillsRegex?: RegExp;
    weight: number;
  }> = [
    {
      spec: Specialization.AI_ENGINEER,
      titleRegex:
        /\b(?:ai|artificial intelligence|machine learning|ml|deep learning|nlp|llm|computer vision|data scientist|prompt engineer)\b/i,
      skillsRegex: /\b(?:pytorch|tensorflow|scikit-learn|langchain|keras|huggingface|opencv|llm)\b/i,
      weight: 10,
    },
    {
      spec: Specialization.DATA,
      titleRegex:
        /\b(?:data engineer|data analyst|bi developer|business intelligence|analytics engineer|big data|etl|dba|database administrator)\b/i,
      skillsRegex: /\b(?:spark|hadoop|airflow|snowflake|dbt|tableau|power bi|sql|pandas)\b/i,
      weight: 9,
    },
    {
      spec: Specialization.DEVOPS,
      titleRegex:
        /\b(?:devops|sre|site reliability|cloud engineer|platform engineer|infrastructure|sysadmin|systems administrator|system administrator)\b/i,
      skillsRegex: /\b(?:kubernetes|k8s|docker|terraform|ansible|aws|azure|gcp|helm|ci\/cd)\b/i,
      weight: 9,
    },
    {
      spec: Specialization.SECURITY,
      titleRegex:
        /\b(?:security|cybersecurity|infosec|appsec|soc analyst|penetration tester|pentester|security engineer)\b/i,
      skillsRegex: /\b(?:owasp|siem|cissp|cryptography|burp suite|vulnerability)\b/i,
      weight: 9,
    },
    {
      spec: Specialization.QA,
      titleRegex:
        /\b(?:qa|quality assurance|tester|software test|test automation|sdet|qc engineer)\b/i,
      skillsRegex: /\b(?:selenium|cypress|playwright|jest|vitest|testng|cucumber|appium)\b/i,
      weight: 8,
    },
    {
      spec: Specialization.MOBILE,
      titleRegex:
        /\b(?:mobile developer|mobile engineer|ios developer|android developer|flutter|react native|swift developer|kotlin developer)\b/i,
      skillsRegex: /\b(?:ios|android|flutter|react native|swift|kotlin|xcode)\b/i,
      weight: 8,
    },
    {
      spec: Specialization.UIUX,
      titleRegex:
        /\b(?:ui\/ux|ui ux|ux\/ui|ux designer|ui designer|product designer|user experience|interaction designer)\b/i,
      skillsRegex: /\b(?:figma|sketch|adobe xd|invision|wireframing|prototyping)\b/i,
      weight: 8,
    },
    {
      spec: Specialization.FULLSTACK,
      titleRegex: /\b(?:fullstack|full-stack|full stack|mern|mean)\b/i,
      weight: 8,
    },
    {
      spec: Specialization.FRONTEND,
      titleRegex:
        /\b(?:frontend|front-end|front end|react developer|vue developer|angular developer|ui developer|web designer)\b/i,
      skillsRegex: /\b(?:react|vue|angular|svelte|next\.js|nuxt|javascript|typescript|html|css|tailwind)\b/i,
      weight: 8,
    },
    {
      spec: Specialization.BACKEND,
      titleRegex:
        /\b(?:backend|back-end|back end|golang|node(?:\.js)?|python|java|php|ruby|\.net|c#|laravel|django|spring boot|api engineer|api developer)\b/i,
      skillsRegex: /\b(?:node\.js|express|nest\.js|python|fastapi|django|golang|java|spring|c#|\.net|php|laravel|postgres|mongodb|redis)\b/i,
      weight: 8,
    },
  ];

  public classify(job: Partial<Job>): ClassificationResult {
    const title = (job.title || '').trim();
    const description = (job.description || '').trim();
    const skillsText = Array.isArray(job.skills) ? job.skills.join(' ') : '';

    // 1. Determine Specializations
    const scores = new Map<Specialization, number>();

    for (const rule of DeterministicJobClassifier.SPECIALIZATION_RULES) {
      let score = 0;
      if (rule.titleRegex.test(title)) {
        score += rule.weight * 3;
      }
      if (rule.skillsRegex && rule.skillsRegex.test(skillsText)) {
        score += rule.weight * 2;
      }
      if (rule.titleRegex.test(description.slice(0, 500))) {
        score += rule.weight;
      }
      if (score > 0) {
        scores.set(rule.spec, score);
      }
    }

    const sortedSpecs = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([spec]) => spec);

    const primarySpecialization: Specialization = sortedSpecs[0] || Specialization.BACKEND;
    const secondarySpecialization: Specialization | null =
      sortedSpecs.length > 1 && sortedSpecs[1] !== primarySpecialization ? sortedSpecs[1] : null;

    // 2. Determine Remote Scope
    const remoteScope = this.resolveRemoteScope(job);

    // 3. Determine Experience Level
    const experienceLevel = this.resolveExperienceLevel(job);

    // 4. Determine Work Type
    const workType = this.resolveWorkType(job);

    return {
      primarySpecialization,
      secondarySpecialization,
      remoteScope,
      experienceLevel,
      workType,
    };
  }

  private resolveRemoteScope(job: Partial<Job>): RemoteScope {
    const text = `${job.title || ''} ${job.location || ''} ${job.description?.slice(0, 300) || ''}`.toLowerCase();

    if (/\b(?:worldwide|global|anywhere|world-wide|everywhere)\b/i.test(text)) {
      return RemoteScope.WORLDWIDE;
    }

    if (/\b(?:mena|middle east|gcc|latam|emea|europe|north america|arab)\b/i.test(text)) {
      return RemoteScope.REGION;
    }

    if (
      job.country ||
      /\b(?:egypt|saudi arabia|uae|united arab emirates|qatar|kuwait|germany|usa|uk|canada)\b/i.test(
        text,
      )
    ) {
      return RemoteScope.COUNTRY;
    }

    if (job.remote) {
      return RemoteScope.WORLDWIDE;
    }

    return RemoteScope.UNKNOWN;
  }

  private resolveExperienceLevel(job: Partial<Job>): ExperienceLevel {
    if (job.experienceLevel) {
      const upper = String(job.experienceLevel).toUpperCase();
      if (upper === 'JUNIOR' || upper === 'ENTRY') return ExperienceLevel.JUNIOR;
      if (upper === 'MID') return ExperienceLevel.MID;
      if (upper === 'SENIOR' || upper === 'LEAD' || upper === 'PRINCIPAL') {
        return ExperienceLevel.SENIOR;
      }
    }

    const text = `${job.title || ''} ${job.description?.slice(0, 300) || ''}`.toLowerCase();

    if (/\b(?:lead|principal|staff|architect|director|head of|senior|sr\.?|expert|advanced)\b/i.test(text)) {
      return ExperienceLevel.SENIOR;
    }
    if (/\b(?:junior|jr\.?|entry[- ]level|associate|fresh graduate|trainee)\b/i.test(text)) {
      return ExperienceLevel.JUNIOR;
    }
    if (/\b(?:mid[- ]level|intermediate)\b/i.test(text)) {
      return ExperienceLevel.MID;
    }

    return ExperienceLevel.UNKNOWN;
  }

  private resolveWorkType(job: Partial<Job>): WorkType {
    if (job.workType) {
      const upper = String(job.workType).toUpperCase().replace('-', '_');
      if (upper in WorkType) {
        return upper as WorkType;
      }
    }

    const text = `${job.title || ''} ${job.description?.slice(0, 300) || ''}`.toLowerCase();

    if (/\b(?:contract|freelance|contractor|consultant)\b/i.test(text)) {
      return WorkType.CONTRACT;
    }
    if (/\b(?:part[- ]time|parttime)\b/i.test(text)) {
      return WorkType.PART_TIME;
    }
    if (/\b(?:intern|internship|training)\b/i.test(text)) {
      return WorkType.INTERNSHIP;
    }
    if (/\b(?:full[- ]time|fulltime|permanent)\b/i.test(text)) {
      return WorkType.FULL_TIME;
    }

    return WorkType.UNKNOWN;
  }
}

export const deterministicJobClassifier = new DeterministicJobClassifier();
