import { GoogleGenAI } from '@google/genai';

import env from '../../../config/env.js';
import type { AIProvider } from './ai-provider.interface.js';
import { AIProviderError } from './ai-provider.error.js';
import type { MatchingInput, MatchingResult } from '../matching.types.js';

export class GeminiProvider implements AIProvider {
  private readonly client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: env.geminiApiKey,
    });
  }

  async match(input: MatchingInput): Promise<MatchingResult> {
    const prompt = `
You are a job matching assistant.

Compare the user's preferences with the job and return a match score from 0 to 100.

Consider:
- Job title
- Skills
- Experience level
- Work type
- Location
- Job description

User preferences:
${JSON.stringify(input.preferences)}

Job:
${JSON.stringify(input.job)}

Return ONLY valid JSON in this exact format:
{
  "score": number,
  "reason": "short explanation"
}
`;

    let response;

    try {
      response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
    } catch {
      throw new AIProviderError('Failed to generate AI matching result');
    }

    return this.parseResponse(response.text);
  }

  private parseResponse(text: string | undefined): MatchingResult {
    if (!text) {
      throw new AIProviderError('AI returned an empty response');
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
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
