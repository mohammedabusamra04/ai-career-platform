import { GoogleGenAI } from '@google/genai';

import env from '../../../config/env.js';
import logger from '../../../shared/utils/logger.js';
import type { AIProvider } from './ai-provider.interface.js';
import { AIProviderError } from './ai-provider.error.js';
import type { MatchingInput, MatchingResult } from '../matching.types.js';

export class GeminiProvider implements AIProvider {
  private readonly client: GoogleGenAI;
  private readonly model = 'gemini-2.0-flash';

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: env.geminiApiKey,
    });
  }

  async match(input: MatchingInput): Promise<MatchingResult> {
    const prompt = `
You are an intelligent job matching assistant.

Compare the user's career preferences with the job posting and evaluate how relevant this job is for the user. Return a match score from 0 to 100.

Guidelines:
- Multilingual support: Treat Arabic and English equivalents (e.g., "مطور واجهات" = "Frontend Developer", "عن بعد" = "Remote", "دوام كامل" = "Full Time") as direct matches.
- Core role and skills relevance: If the job title or primary technical role aligns with the user's target domain (e.g. Backend, Frontend, Full Stack, Mobile, etc.), provide a generous match score between 55 and 95.
- If the role or domain is closely related, assign a score of 45-70.
- Only assign very low scores (<30) if the job field is completely unrelated.

User preferences:
${JSON.stringify(input.preferences)}

Job posting:
${JSON.stringify(input.job)}

Return ONLY valid JSON in this exact format:
{
  "score": number,
  "reason": "short explanation in English"
}
`;

    let response;

    try {
      response = await this.generateWithRetry({
        model: this.model,
        contents: prompt,
      });
    } catch (err) {
      throw new AIProviderError(
        `Failed to generate AI matching result: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return this.parseResponse(response.text);
  }

  /**
   * Retries transient Gemini failures (503/429/500) with exponential backoff,
   * adapted from Daily_Jobs_Bot agent.js.
   */
  private async generateWithRetry(
    params: { model: string; contents: string },
    maxRetries = 4,
  ): Promise<{ text: string | undefined }> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.models.generateContent(params);
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number })?.status;
        const isRetryable = status === 503 || status === 429 || status === 500;

        if (!isRetryable || attempt === maxRetries) {
          throw err;
        }

        const waitMs = 2000 * Math.pow(2, attempt);
        logger.warn(
          `Transient Gemini error (status ${status}), retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    throw lastError;
  }

  private parseResponse(text: string | undefined): MatchingResult {
    if (!text) {
      throw new AIProviderError('AI returned an empty response');
    }

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: unknown;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AIProviderError('AI returned invalid JSON');
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('score' in parsed) ||
      !('reason' in parsed)
    ) {
      throw new AIProviderError('AI returned an invalid matching result');
    }

    const result = parsed as {
      score: unknown;
      reason: unknown;
    };

    if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
      throw new AIProviderError('AI returned an invalid score');
    }

    if (typeof result.reason !== 'string') {
      throw new AIProviderError('AI returned an invalid reason');
    }

    return {
      score: result.score,
      reason: result.reason,
    };
  }
}
