import { createHash } from 'node:crypto';

import type { Job } from '../jobs/job.types.js';
import { TRACKING_QUERY_PARAMS } from '../jobs/job.sanitizer.js';

/**
 * TASK-28.1: Level 1 SHA-256 Composite Fingerprint Engine (#86)
 *
 * Implements deterministic composite hashing for job postings:
 * Formula: SHA256(canonical(title) + "|" + canonical(company) + "|" + cleanUrl(url))
 *
 * Used as Job.deduplicationKey in PostgreSQL for O(1) duplicate detection.
 */
export class FingerprintService {
  /**
   * Generates the primary composite fingerprint (Level 1) for a job posting.
   * Matches identical listings from the same source/URL.
   *
   * Formula: SHA256(canonical(title) + "|" + canonical(company) + "|" + cleanUrl(url))
   */
  generate(job: Partial<Job>): string {
    const canonicalTitle = this.canonicalizeTitle(job.title || '');
    const canonicalCompany = this.canonicalizeCompany(job.company || '');
    const canonicalUrl = this.canonicalizeUrl(job.applicationUrl || job.url || '');

    const data = `${canonicalTitle}|${canonicalCompany}|${canonicalUrl}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Explicit semantic alias for generate() representing the PostgreSQL Job.deduplicationKey.
   */
  generateDeduplicationKey(job: Partial<Job>): string {
    return this.generate(job);
  }

  /**
   * Generates a semantic fingerprint (Level 2) based only on normalized title and company
   * to detect cross-source duplicates.
   */
  generateSemanticFingerprint(job: Partial<Job>): string {
    const canonicalTitle = this.canonicalizeTitle(job.title || '');
    const canonicalCompany = this.canonicalizeCompany(job.company || '');

    const data = `${canonicalTitle}|${canonicalCompany}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates a URL fingerprint based on the canonicalized URL.
   */
  generateUrlFingerprint(rawUrl: string): string {
    const canonicalUrl = this.canonicalizeUrl(rawUrl);
    return createHash('sha256').update(canonicalUrl).digest('hex');
  }

  /**
   * Canonicalizes a URL by:
   * 1. Stripping tracking parameters (UTM, click trackers, analytics tags)
   * 2. Lowercasing entire URL (protocol, hostname, pathname)
   * 3. Removing 'www.', default ports, trailing slashes, and hash fragments
   * 4. Sorting remaining functional query parameters deterministically
   */
  canonicalizeUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(rawUrl.trim());

      // Strip known tracking query params
      const keysToDelete: string[] = [];
      for (const key of parsed.searchParams.keys()) {
        const lowerKey = key.toLowerCase();
        if (
          TRACKING_QUERY_PARAMS.has(lowerKey) ||
          lowerKey === 'trk' ||
          lowerKey === 'spjobid' ||
          lowerKey === 'source' ||
          lowerKey === 'origin'
        ) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        parsed.searchParams.delete(key);
      }

      // Remove fragment / hash
      parsed.hash = '';

      // Normalize hostname and protocol
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const protocol = parsed.protocol.toLowerCase();

      // Normalize pathname: lowercase and remove trailing slash unless root
      let pathname = parsed.pathname.toLowerCase().replace(/\/+$/, '');
      if (!pathname) {
        pathname = '/';
      }

      // Sort remaining functional query parameters deterministically
      const searchParams = Array.from(parsed.searchParams.entries()).sort(
        ([aKey, aVal], [bKey, bVal]) => {
          const comp = aKey.toLowerCase().localeCompare(bKey.toLowerCase());
          return comp !== 0 ? comp : aVal.localeCompare(bVal);
        },
      );

      const search = searchParams
        .map(([k, v]) => `${encodeURIComponent(k.toLowerCase())}=${encodeURIComponent(v)}`)
        .join('&');

      return `${protocol}//${host}${pathname}${search ? `?${search}` : ''}`;
    } catch {
      return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }

  /**
   * Canonicalizes a job title by:
   * 1. Converting to lowercase
   * 2. Removing noise tags like (m/f/d), (Remote), [Urgent], (عن بعد), etc.
   * 3. Removing special characters and symbols while preserving unicode alphanumeric text
   * 4. Collapsing whitespace
   */
  canonicalizeTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      return '';
    }

    return title
      .toLowerCase()
      // Remove common noise tags (English & Arabic)
      .replace(
        /\((?:m\/f\/d|m\/w\/d|w\/m\/d|f\/m\/d|remote|hybrid|onsite|urgent|عن\s*بعد|عمل\s*عن\s*بعد|دوام\s*كامل|دوام\s*جزئي)\)/gi,
        ' ',
      )
      .replace(
        /\[(?:remote|hybrid|onsite|urgent|full-time|part-time|عن\s*بعد|عمل\s*عن\s*بعد|دوام\s*كامل|دوام\s*جزئي)\]/gi,
        ' ',
      )
      .replace(/[-_–—|#/]/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Backward-compatible alias for canonicalizeTitle.
   */
  normalizeTitle(title: string): string {
    return this.canonicalizeTitle(title);
  }

  /**
   * Canonicalizes a company name by:
   * 1. Converting to lowercase
   * 2. Stripping legal / corporate entity suffixes in English and Arabic
   * 3. Removing special characters and symbols while preserving unicode alphanumeric text
   * 4. Collapsing whitespace
   */
  canonicalizeCompany(company: string): string {
    if (!company || typeof company !== 'string') {
      return '';
    }

    // Strip corporate suffixes iteratively to catch multiple suffixes (e.g. "شركة ... ذ.م.م")
    let cleaned = company.toLowerCase();

    // English corporate suffixes
    cleaned = cleaned.replace(
      /\b(?:inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|gmbh|co\.?|sae|fze|plc)\b/gi,
      ' ',
    );

    // Arabic corporate prefixes & suffixes
    cleaned = cleaned.replace(
      /(?:^|\s)(?:شركة|ش[\s.]*م[\s.]*م|ذ[\s.]*م[\s.]*م|مساهمة|القابضة|المحدودة)(?:\s|$)/gi,
      ' ',
    );
    cleaned = cleaned.replace(
      /(?:^|\s)(?:شركة|ش[\s.]*م[\s.]*م|ذ[\s.]*م[\s.]*م|مساهمة|القابضة|المحدودة)(?:\s|$)/gi,
      ' ',
    );

    return cleaned
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Backward-compatible alias for canonicalizeCompany.
   */
  normalizeCompany(company: string): string {
    return this.canonicalizeCompany(company);
  }
}
