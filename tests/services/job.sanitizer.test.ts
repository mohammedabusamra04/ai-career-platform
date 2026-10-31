import { describe, it, expect } from 'vitest';
import ms from 'ms';
import {
  stripHtml,
  stripUtmParams,
  isValidUrl,
  cleanUrl,
  decodeHtmlEntities,
  stripControlCharacters,
  sanitizeSingleLine,
  sanitizeMultiLine,
  formatDurationMs,
  DEFAULT_SANITIZATION_TIMEOUT_MS,
  URL_NORMALIZATION_CACHE_TTL_MS,
} from '../../src/modules/jobs/job.sanitizer.js';

describe('TASK-27.1: job.sanitizer', () => {
  describe('HTML stripping and entity decoding', () => {
    it('meets acceptance criteria: strips HTML and decodes &amp;', () => {
      const input = '<p>Senior Backend <b>Engineer</b> &amp; Team Lead</p>';
      const output = stripHtml(input);
      expect(output).toBe('Senior Backend Engineer & Team Lead');
    });

    it('preserves line breaks for paragraph and block level elements', () => {
      const input = `
        <h3>Job Overview</h3>
        <p>First paragraph with <strong>bold</strong> text.</p>
        <p>Second paragraph with <em>italic</em> text.</p>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
        </ul>
      `;
      const output = stripHtml(input);
      expect(output).toContain('Job Overview\nFirst paragraph with bold text.');
      expect(output).toContain('Second paragraph with italic text.');
      expect(output).toContain('Point 1\nPoint 2');
    });

    it('decodes various named, decimal, and hex HTML entities', () => {
      const input = 'Copyright &copy; 2026 &mdash; High&nbsp;Performance &quot;Fast&quot; &#39;Quotes&#39;';
      const output = decodeHtmlEntities(input);
      expect(output).toBe('Copyright © 2026 — High Performance "Fast" \'Quotes\'');
    });

    it('safely strips dangerous <script> and <style> blocks and their content', () => {
      const input = '<div>Hello<script>alert("XSS")</script><style>body { color: red; }</style> World!</div>';
      const output = stripHtml(input);
      expect(output).toBe('Hello World!');
      expect(output).not.toContain('alert');
      expect(output).not.toContain('color: red');
    });

    it('strips non-printable control characters while keeping tabs and newlines', () => {
      const input = 'Clean\x00\x07Text\twith\nnewlines';
      const output = stripControlCharacters(input);
      expect(output).toBe('CleanText\twith\nnewlines');
    });
  });

  describe('Single-line and multi-line field sanitizers', () => {
    it('collapses single-line strings like titles and companies', () => {
      const title = '<h1>  Senior\n  Fullstack\t Engineer  </h1>';
      expect(sanitizeSingleLine(title)).toBe('Senior Fullstack Engineer');

      const company = '  <b>Acme &amp; Co.</b>\x00 ';
      expect(sanitizeSingleLine(company)).toBe('Acme & Co.');
    });

    it('handles empty, null, or undefined inputs gracefully', () => {
      expect(sanitizeSingleLine(undefined)).toBe('');
      expect(sanitizeSingleLine(null)).toBe('');
      expect(sanitizeSingleLine('')).toBe('');
      expect(sanitizeMultiLine(undefined)).toBe('');
      expect(sanitizeMultiLine(null)).toBe('');
      expect(sanitizeMultiLine('')).toBe('');
    });
  });

  describe('URL sanitization and UTM parameter stripping', () => {
    it('meets acceptance criteria: strips UTM tracking parameters', () => {
      const input = 'https://company.com/job?utm_source=adzuna&utm_medium=api';
      const output = stripUtmParams(input);
      expect(output).toBe('https://company.com/job');
    });

    it('strips UTM, Facebook, and Google tracking parameters while preserving functional query params', () => {
      const input =
        'https://boards.greenhouse.io/job/123?utm_campaign=oct&fbclid=abc123xyz&id=999&gclid=g1&page=2&ref=jobboard';
      const output = stripUtmParams(input);
      expect(output).toBe('https://boards.greenhouse.io/job/123?id=999&page=2');
    });

    it('validates URLs using Zod schema', () => {
      expect(isValidUrl('https://example.com/jobs/1')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('cleanUrl strips UTM parameters and validates URL', () => {
      expect(cleanUrl('https://remotive.com/job/456?utm_source=google')).toBe('https://remotive.com/job/456');
      expect(cleanUrl('invalid-url-string')).toBe('');
      expect(cleanUrl(undefined)).toBe('');
      expect(cleanUrl(null)).toBe('');
    });
  });

  describe('ms library constants and duration formatting', () => {
    it('verifies ms library defines processing timeouts and cache TTLs', () => {
      expect(DEFAULT_SANITIZATION_TIMEOUT_MS).toBe(ms('2s'));
      expect(DEFAULT_SANITIZATION_TIMEOUT_MS).toBe(2000);

      expect(URL_NORMALIZATION_CACHE_TTL_MS).toBe(ms('1h'));
      expect(URL_NORMALIZATION_CACHE_TTL_MS).toBe(3600000);
    });

    it('formats duration in milliseconds to human-readable string', () => {
      expect(formatDurationMs(500)).toBe('500ms');
      expect(formatDurationMs(2500)).toBe('3s');
      expect(formatDurationMs(60000)).toBe('1m');
    });
  });
});
