import type { MatchingInput, MatchingResult } from '../matching.types.js';

export interface AIProvider {
  match(input: MatchingInput): Promise<MatchingResult>;
}
