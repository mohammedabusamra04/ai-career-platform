import type { Cache } from '../../cache/cache.interface.js';
import { cacheKeys } from '../../cache/cache.keys.js';
import { CACHE_TTL } from '../../cache/cache.ttl.js';
import type { Job } from '../jobs/job.types.js';
import type { UserPreferences } from '../preferences/preference.types.js';
import logger from '../../shared/utils/logger.js';

import type { AIProvider } from './ai/ai-provider.interface.js';
import type { JobAnalysis } from './matching.types.js';

export interface MatchedJob {
  job: Job;
  score: number;
  reason: string;
}

interface JobFingerprinter {
  generate(job: Job): string;
}

export class MatchingService {
  private readonly fingerprintService: JobFingerprinter;

  constructor(
    private readonly aiProvider: AIProvider,
    private readonly cache?: Cache,
    fingerprintService?: JobFingerprinter,
  ) {
    this.fingerprintService = fingerprintService ?? {
      generate: (job: Job) => job.url || job.applicationUrl || `${job.title}:${job.company}`,
    };
  }

  async analyzeJobs(
    jobs: Job[],
  ): Promise<Map<string, JobAnalysis>> {
    const analyses = new Map<string, JobAnalysis>();
    let totalWaited = 0;
    const MAX_WAIT = 300_000; // 5 minutes
    for (const job of jobs) {
      const fingerprint =
        this.fingerprintService.generate(job);

      const analysisKey =
        cacheKeys.jobAnalysis(fingerprint);

      /*
       * Redis first.
       *
       * If another pipeline run already analyzed this job,
       * reuse the cached result.
       */
      const cached = this.cache
        ? await this.cache.get<JobAnalysis>(analysisKey)
        : null;

      if (cached) {
        analyses.set(fingerprint, cached);

        logger.info(
          `Using cached AI analysis for job "${job.title}".`,
        );

        continue;
      }

      /*
       * Do not call Gemini if all API-key/model slots
       * are currently unavailable.
       */
      if (!this.aiProvider.hasAvailableSlot()) {
       const wait = this.aiProvider.msUntilAvailable?.() ?? 0;

     if (wait > 0 && wait <= 120_000 && totalWaited < MAX_WAIT) {
         await new Promise((r) => setTimeout(r, wait));
         totalWaited += wait;
      }

     if (!this.aiProvider.hasAvailableSlot()) {
        logger.warn(
          `Skipping AI analysis for "${job.title}" because all Gemini slots are unavailable.`,
        );
        continue;
      }
}

      try {
        const result =
          await this.aiProvider.analyzeJob(job);

        const analysis: JobAnalysis = {
          role: result.role,
          level: result.experienceLevel,
          skills: result.skills,
          workType: result.workType,
        };

        if (this.cache) {
          await this.cache.set(
            analysisKey,
            analysis,
            CACHE_TTL.JOB_ANALYSIS,
          );
        }

        analyses.set(
          fingerprint,
          analysis,
        );

        logger.info(
          `AI analysis generated for job "${job.title}".`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : String(error);

        logger.warn(
          `Job analysis failed for "${job.title}": ${errorMessage}`,
        );
      }
    }

    return analyses;
  }

  async matchJobs(
    jobs: Job[],
    preferences: UserPreferences,
    analyses: Map<string, JobAnalysis> = new Map(),
  ): Promise<MatchedJob[]> {
    const matchedJobs: MatchedJob[] = [];

    for (const job of jobs) {
      const fingerprint =
        this.fingerprintService.generate(job);

      /*
       * O(1) average lookup.
       */
      const analysis =
        analyses?.get(fingerprint);

      /*
       * If AI analysis exists,
       * use AI-based matching.
       *
       * If AI analysis does not exist,
       * use rule-based matching as fallback.
       */
      const result = analysis
        ? this.calculateMatch(
            job,
            analysis,
            preferences,
          )
        : this.calculateRuleBasedMatch(
            job,
            preferences,
          );

      matchedJobs.push({
        job,
        score: result.score,
        reason: result.reason,
      });
    }

    return matchedJobs.sort(
      (a, b) => b.score - a.score,
    );
  }

  /*
   * Rule-based fallback.
   *
   * Used when AI analysis is unavailable.
   */
  private calculateRuleBasedMatch(
    job: Job,
    preferences: UserPreferences,
  ): {
    score: number;
    reason: string;
  } {
    let score = 0;

    const reasons: string[] = [];

    /*
     * Role
     */
    if (
      preferences.jobTitle &&
      this.textMatches(
        job.title,
        preferences.jobTitle,
      )
    ) {
      score += 35;

      reasons.push(
        'role matches',
      );
    }

    /*
     * Skills
     */
    if (
      preferences.skills?.length &&
      job.skills.length
    ) {
      const matchedSkills =
        preferences.skills.filter((skill) =>
          job.skills.some((jobSkill) =>
            this.textMatches(
              jobSkill,
              skill,
            ),
          ),
        );

      if (matchedSkills.length > 0) {
        const skillScore = Math.min(
          30,
          matchedSkills.length * 10,
        );

        score += skillScore;

        reasons.push(
          `${matchedSkills.length} skill(s) match`,
        );
      }
    }

    /*
     * Experience level
     */
    if (
  preferences.experienceLevel &&
  job.experienceLevel
) {
  if (
    this.textMatches(
      job.experienceLevel,
      preferences.experienceLevel,
    )
  ) {
    score += 20;
    reasons.push('experience level matches');
  } else {
    score -= 15;
    reasons.push('experience level does not match');
  }
}

    /*
     * Work type
     */
    if (preferences.workType) {
      if (preferences.workType === 'any') {
        score += 15;
        reasons.push('work type matches (any)');
      } else if (
        job.workType &&
        this.textMatches(job.workType, preferences.workType)
      ) {
        score += 15;
        reasons.push('work type matches');
      } else if (
        preferences.workType === 'remote' &&
        job.remote === true
      ) {
        score += 15;
        reasons.push('remote matches');
      }
    }

    return {
      score: Math.min(score, 100),
      reason:
        reasons.length > 0
          ? reasons.join(', ')
          : 'Rule-based match',
    };
  }

  private calculateMatch(
    _job: Job,
    analysis: JobAnalysis,
    preferences: UserPreferences,
  ): {
    score: number;
    reason: string;
  } {
    let score = 0;

    const reasons: string[] = [];

    /*
     * Role
     */
    if (
      preferences.jobTitle &&
      this.textMatches(
        analysis.role,
        preferences.jobTitle,
      )
    ) {
      score += 35;
      reasons.push('role matches');
    }

    /*
     * Skills
     */
    if (preferences.skills?.length) {
      const matchedSkills =
        preferences.skills.filter((skill) =>
          analysis.skills.some((jobSkill) =>
            this.textMatches(
              jobSkill,
              skill,
            ),
          ),
        );

      if (matchedSkills.length > 0) {
        const skillScore = Math.min(
          30,
          matchedSkills.length * 10,
        );

        score += skillScore;

        reasons.push(
          `${matchedSkills.length} skill(s) match`,
        );
      }
    }

    /*
     * Experience level
     */
    if (
      preferences.experienceLevel &&
      this.textMatches(
        analysis.level,
        preferences.experienceLevel,
      )
    ) {
      score += 20;

      reasons.push(
        'experience level matches',
      );
    }

    /*
     * Work type
     */
    if (preferences.workType) {
      if (preferences.workType === 'any') {
        score += 15;
        reasons.push('work type matches (any)');
      } else if (
        analysis.workType &&
        this.textMatches(
          analysis.workType,
          preferences.workType,
        )
      ) {
        score += 15;
        reasons.push('work type matches');
      }
    }

    return {
      score: Math.min(score, 100),
      reason:
        reasons.length > 0
          ? reasons.join(', ')
          : 'No strong match found',
    };
  }

  private textMatches(
    a: string,
    b: string,
  ): boolean {
    const normalize = (
      value: string,
    ): string =>
      value
        .toLowerCase()
        .trim()
        .replace(/[._-]/g, ' ')
        .replace(/\s+/g, ' ');

    const first = normalize(a);
    const second = normalize(b);

    if (first === second) {
      return true;
    }

    return (
      first.includes(second) ||
      second.includes(first)
    );
  }
}