import { createHash } from 'node:crypto';

import type { Job } from '../jobs/job.types.js';

export class FingerprintService {
  /**
   * Generates the primary composite fingerprint for a job.
   */
  generate(job: Job): string {
    const canonicalUrl = this.canonicalizeUrl(job.applicationUrl || job.url || '');
    const canonicalTitle = this.normalizeTitle(job.title);
    const canonicalCompany = this.normalizeCompany(job.company);

    const data = `${canonicalTitle}|${canonicalCompany}|${canonicalUrl}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates a semantic fingerprint based only on normalized title and company
   * to detect cross-source duplicates.
   */
  generateSemanticFingerprint(job: Job): string {
    const canonicalTitle = this.normalizeTitle(job.title);
    const canonicalCompany = this.normalizeCompany(job.company);

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

  canonicalizeUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(rawUrl.trim());

      // Tracking parameters to strip
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'ref',
        'referrer',
        'fbclid',
        'gclid',
        'trk',
        'source',
        'origin',
        'spJobID',
      ];

      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }

      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      let pathname = parsed.pathname.replace(/\/+$/, '');
      if (!pathname) {
        pathname = '/';
      }

      const search = parsed.searchParams.toString();
      return `https://${host}${pathname}${search ? `?${search}` : ''}`.toLowerCase();
    } catch {
      return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }

  normalizeTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      return '';
    }

    return title
      .toLowerCase()
      // Remove common noise tags like (m/f/d), [Remote], (Remote), (w/m/d), etc.
      .replace(/\((?:m\/f\/d|m\/w\/d|w\/m\/d|f\/m\/d|remote|hybrid|onsite|urgent)\)/gi, '')
      .replace(/\[(?:remote|hybrid|onsite|urgent|full-time|part-time)\]/gi, '')
      .replace(/[-_–—|#]/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeCompany(company: string): string {
    if (!company || typeof company !== 'string') {
      return '';
    }

    return company
      .toLowerCase()
      // Strip common corporate entity suffixes
      .replace(/\b(?:inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|gmbh|co\.?|sae|fze)\b/gi, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
