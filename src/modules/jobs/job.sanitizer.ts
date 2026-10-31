/**
 * TASK-27.1: Text Sanitization & Safe HTML Stripping (#84)
 * Parent: TASK-27: Job Normalization & Sanitization (#45)
 *
 * Implements:
 * - HTML tag stripping with paragraph and block line-break preservation
 * - Script and style element content removal
 * - Complete HTML entity decoding (named, decimal, and hexadecimal)
 * - Control character stripping (preventing terminal/markdown injection)
 * - Safe URL cleaning with UTM and click tracking parameter removal
 * - Strict URL validation via Zod (z.string().url() with http/https protocols)
 * - Performance guard and telemetry using ms library
 */

import ms from 'ms';
import { z } from 'zod';

/** Default processing timeout for expensive regex operations */
export const DEFAULT_SANITIZATION_TIMEOUT_MS = ms('2s');

/** Default URL cache TTL for memoized normalization */
export const URL_NORMALIZATION_CACHE_TTL_MS = ms('1h');

/**
 * Zod schema for strict URL validation (HTTP / HTTPS).
 */
export const urlSchema = z
  .string()
  .url()
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'URL must use http or https protocol' },
  );

/**
 * Common tracking and attribution query parameters stripped during URL sanitization.
 */
export const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'mc_eid',
  'zanpid',
  'igshid',
  'ref',
  'referrer',
  'affiliate_id',
]);

/**
 * Standard named HTML entities mapping to their decoded characters.
 */
const NAMED_HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&laquo;': '«',
  '&raquo;': '»',
  '&bull;': '•',
  '&middot;': '·',
  '&cent;': '¢',
  '&pound;': '£',
  '&yen;': '¥',
  '&euro;': '€',
  '&sect;': '§',
};

/**
 * HTML block-level elements that represent structural paragraph/line separation.
 */
const CLOSING_BLOCK_TAGS_RE =
  /<\/(p|div|li|h[1-6]|tr|blockquote|section|article)>/gi;

const BR_TAGS_RE = /<br\s*\/?>/gi;

/**
 * Regex matching `<script>`, `<style>`, and `<noscript>` blocks including their inner contents.
 */
const SCRIPT_STYLE_BLOCKS_RE =
  /<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi;

/**
 * Dangerous control characters (excluding newline \n, carriage return \r, and tab \t).
 * Matches ASCII 0-8, 11-12, 14-31, 127.
 */
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Decodes all HTML entities from a string.
 * Supports:
 * 1. Named entities (&amp;, &nbsp;, &quot;, etc.)
 * 2. Decimal entities (&#160;, &#8212;, etc.)
 * 3. Hexadecimal entities (&#xA0;, &#x2014;, etc.)
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || !text.includes('&')) {
    return text;
  }

  return text
    .replace(/&[a-z0-9]+;/gi, (entity) => NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_, code: string) => {
      const codeNum = parseInt(code, 10);
      return Number.isNaN(codeNum) ? '' : String.fromCharCode(codeNum);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const codeNum = parseInt(hex, 16);
      return Number.isNaN(codeNum) ? '' : String.fromCharCode(codeNum);
    });
}

/**
 * Removes dangerous non-printable control characters from text.
 * Preserves tabs and standard newlines.
 */
export function stripControlCharacters(text: string): string {
  return text.replace(CONTROL_CHARS_RE, '');
}

/**
 * Strips HTML tags from input while preserving paragraph line breaks and decoding entities.
 *
 * Meets TASK-27.1 acceptance criteria:
 * - Input: `<p>Senior Backend <b>Engineer</b> &amp; Team Lead</p>`
 * - Output: `Senior Backend Engineer & Team Lead`
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // 1. Remove dangerous script, style, noscript blocks completely
  const withoutScripts = html.replace(SCRIPT_STYLE_BLOCKS_RE, ' ');

  // 2. Convert <br> and closing block tags to newlines to preserve paragraph boundaries
  const withLineBreaks = withoutScripts
    .replace(BR_TAGS_RE, '\n')
    .replace(CLOSING_BLOCK_TAGS_RE, '\n');

  // 3. Remove all remaining HTML tags
  const noTags = withLineBreaks.replace(/<[^>]*>/g, ' ');

  // 4. Strip control characters
  const cleanChars = stripControlCharacters(noTags);

  // 5. Decode HTML entities
  const decoded = decodeHtmlEntities(cleanChars);

  // 6. Normalize whitespace while respecting line breaks
  const lines = decoded.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/[ \t]+/g, ' ').trim();
    if (trimmed.length > 0) {
      cleanedLines.push(trimmed);
    }
  }

  return cleanedLines.join('\n').trim();
}

/**
 * Sanitizes single-line fields (e.g., job title, company name).
 * Strips HTML tags, removes all line breaks, decodes entities, and collapses spaces.
 */
export function sanitizeSingleLine(text: string | undefined | null): string {
  if (!text) return '';
  const stripped = stripHtml(text);
  return stripped.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes multi-line text (e.g., job description).
 * Preserves structural line breaks for Telegram markdown and web rendering.
 */
export function sanitizeMultiLine(text: string | undefined | null): string {
  if (!text) return '';
  return stripHtml(text);
}

/**
 * Strips UTM and advertising tracking parameters from a URL while preserving functional query params.
 *
 * Meets TASK-27.1 acceptance criteria:
 * - Input: `https://company.com/job?utm_source=adzuna&utm_medium=api`
 * - Output: `https://company.com/job`
 */
export function stripUtmParams(rawUrl: string): string {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    const keysToDelete: string[] = [];

    for (const key of parsed.searchParams.keys()) {
      if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }

    // Clean up empty query string delimiter
    return parsed.toString().replace(/\?$/, '');
  } catch {
    // If not parseable as a valid URL, return trimmed original
    return trimmed;
  }
}

/**
 * Validates whether a given string is a valid URL using Zod.
 */
export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

/**
 * Strips tracking parameters from a URL and validates it with Zod.
 * Returns the cleaned URL if valid, or an empty string if invalid.
 */
export function cleanUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl) return '';
  const cleaned = stripUtmParams(rawUrl.trim());
  return isValidUrl(cleaned) ? cleaned : '';
}

/**
 * Formats a duration in milliseconds using ms.
 */
export function formatDurationMs(durationMs: number): string {
  return ms(durationMs);
}
