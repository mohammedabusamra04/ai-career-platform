import { RemoteScope } from '@prisma/client';
import type { Job } from '../job.types.js';

export interface RemoteScopeClassification {
  scope: RemoteScope;
  country: string | null;
  evidence: string;
}

/**
 * Remote Eligibility & Regional Scope Classifier (TASK-33.1 / Issue #99).
 *
 * Evaluates remote work scope into 4 tiers:
 * 1. COUNTRY: Restricted to a specific country (e.g. "Remote - US only", "Must reside in Germany").
 * 2. REGION: Restricted to a macro region (e.g. MENA, GCC, Europe, EMEA).
 * 3. WORLDWIDE: Open globally without geographic restrictions, requiring affirmative evidence.
 * 4. UNKNOWN: Insufficient or ambiguous data.
 *
 * Golden Rule: Never classify as WORLDWIDE unless explicit affirmative evidence exists.
 * Geographic restrictions strictly override generic remote claims.
 */
export class RemoteScopeClassifier {
  // Mapping of common country names, variations, and Arabic names to ISO 3166-1 alpha-2
  private static readonly COUNTRY_MAP: Record<string, string> = {
    // Germany
    germany: 'DE',
    deutschland: 'DE',
    de: 'DE',
    ألمانيا: 'DE',
    المانيا: 'DE',

    // USA
    usa: 'US',
    'united states': 'US',
    'united states of america': 'US',
    us: 'US',
    'u.s.': 'US',
    'u.s.a.': 'US',
    أمريكا: 'US',
    امريكا: 'US',
    'الولايات المتحدة': 'US',

    // United Kingdom
    'united kingdom': 'GB',
    uk: 'GB',
    'u.k.': 'GB',
    'great britain': 'GB',
    britain: 'GB',
    england: 'GB',
    بريطانيا: 'GB',
    'المملكة المتحدة': 'GB',
    إنجلترا: 'GB',

    // Canada
    canada: 'CA',
    ca: 'CA',
    كندا: 'CA',

    // Egypt
    egypt: 'EG',
    eg: 'EG',
    مصر: 'EG',

    // Saudi Arabia
    'saudi arabia': 'SA',
    saudi: 'SA',
    ksa: 'SA',
    sa: 'SA',
    السعودية: 'SA',
    'المملكة العربية السعودية': 'SA',

    // UAE
    uae: 'AE',
    'united arab emirates': 'AE',
    dubai: 'AE',
    'abu dhabi': 'AE',
    ae: 'AE',
    الإمارات: 'AE',
    الامارات: 'AE',

    // Qatar
    qatar: 'QA',
    qa: 'QA',
    قطر: 'QA',

    // Kuwait
    kuwait: 'KW',
    kw: 'KW',
    الكويت: 'KW',

    // Jordan
    jordan: 'JO',
    jo: 'JO',
    الأردن: 'JO',
    الاردن: 'JO',

    // France
    france: 'FR',
    fr: 'FR',
    فرنسا: 'FR',

    // Spain
    spain: 'ES',
    es: 'ES',
    إسبانيا: 'ES',
    اسبانيا: 'ES',

    // Italy
    italy: 'IT',
    it: 'IT',
    إيطاليا: 'IT',
    ايطاليا: 'IT',

    // Netherlands
    netherlands: 'NL',
    holland: 'NL',
    nl: 'NL',
    هولندا: 'NL',

    // Poland
    poland: 'PL',
    pl: 'PL',
    بولندا: 'PL',

    // Australia
    australia: 'AU',
    au: 'AU',
    أستراليا: 'AU',
    استراليا: 'AU',

    // India
    india: 'IN',
    in: 'IN',
    الهند: 'IN',

    // Pakistan
    pakistan: 'PK',
    pk: 'PK',
    باكستان: 'PK',

    // Turkey
    turkey: 'TR',
    türkiye: 'TR',
    tr: 'TR',
    تركيا: 'TR',

    // Ireland
    ireland: 'IE',
    ie: 'IE',
    أيرلندا: 'IE',

    // Switzerland
    switzerland: 'CH',
    ch: 'CH',
    سويسرا: 'CH',

    // Brazil
    brazil: 'BR',
    br: 'BR',
    البرازيل: 'BR',
  };

  // Worldwide affirmative evidence regular expressions
  private static readonly WORLDWIDE_REGEX =
    /\b(?:worldwide|world-wide|globally|work from anywhere|anywhere in the world|work anywhere|global remote|worldwide remote|remote worldwide)\b|(?:من\s+أي\s+مكان\s+في\s+العالم|عالمي(?:اً)?|حول\s+العالم|في\s+أي\s+مكان)/i;

  // Macro-region regular expressions
  private static readonly REGION_REGEX =
    /\b(?:mena|middle east|gcc|latam|emea|apac|europe|european union|eu|north america|latin america|asia-pacific|nordics?|benelux|arab world|gulf)\b|(?:الشرق\s+الأوسط|الخليج|الخليج\s+العربي|دول\s+الخليج|شمال\s+إفريقيا|أوروبا|اوروبا|أمريكا\s+الشمالية|الوطن\s+العربي)/i;

  // Country restriction pattern: e.g. "Must reside in Germany", "Remote - USA only", "عن بعد - السعودية فقط", "UK residents only"
  private static readonly RESTRICTION_PHRASES_REGEX =
    /(?:(?:must reside in|must be based in|only for residents of|residents? of|based in|located in|living in|only in)\s+([a-zA-Z\s]+))|(?:(?:remote|عن\s+بعد)\s*[-–—:]\s*([a-zA-Z\u0621-\u064A\s]+?)(?:\s*(?:only|فقط))?(?=[,\n\r.)]|$))|(?:([a-zA-Z\s]+)\s+residents?\s+only)|(?:(?:يشترط\s+الإقامة\s+في|للمقيمين\s+في|داخل)\s+([a-zA-Z\u0621-\u064A\s]+))/i;

  /**
   * Classifies the remote scope and extracted country constraint for a job.
   */
  public classify(job: Partial<Job>): RemoteScopeClassification {
    const title = (job.title || '').trim();
    const location = (job.location || '').trim();
    const description = (job.description || '').slice(0, 1500);
    const structuredCountry = (job.country || '').trim();

    const fullText = `${title} ${location} ${description}`;

    // 1. Check for explicit Country restrictions (Highest Precedence - overrides generic remote)
    const detectedCountry = this.extractCountryConstraint(
      title,
      location,
      description,
      structuredCountry,
    );

    if (detectedCountry) {
      return {
        scope: RemoteScope.COUNTRY,
        country: detectedCountry,
        evidence: `Country restriction detected: ${detectedCountry}`,
      };
    }

    // 2. Check for Regional restrictions (MENA, GCC, Europe, etc.)
    const regionMatch = fullText.match(RemoteScopeClassifier.REGION_REGEX);
    if (regionMatch) {
      return {
        scope: RemoteScope.REGION,
        country: null,
        evidence: `Regional constraint detected: ${regionMatch[0]}`,
      };
    }

    // 3. Check for Affirmative Worldwide evidence (Golden Rule: explicit affirmative keywords required)
    const worldwideMatch = fullText.match(RemoteScopeClassifier.WORLDWIDE_REGEX);
    if (worldwideMatch) {
      return {
        scope: RemoteScope.WORLDWIDE,
        country: null,
        evidence: `Affirmative worldwide keywords: "${worldwideMatch[0]}"`,
      };
    }

    // Explicit "Anywhere" in location
    if (/\b(?:anywhere|everywhere)\b/i.test(location)) {
      return {
        scope: RemoteScope.WORLDWIDE,
        country: null,
        evidence: `Location explicitly specified: "${location}"`,
      };
    }

    // 4. Source remote flag without restrictions
    if (job.remote) {
      return {
        scope: RemoteScope.WORLDWIDE,
        country: null,
        evidence: 'Source remote flag without geographic restrictions',
      };
    }

    // 5. Default: Insufficient data or unverified remote claims
    return {
      scope: RemoteScope.UNKNOWN,
      country: null,
      evidence: 'No conclusive remote scope evidence',
    };
  }

  /**
   * Extracts country constraint and maps to ISO 3166-1 alpha-2 code.
   */
  private extractCountryConstraint(
    title: string,
    location: string,
    description: string,
    structuredCountry?: string,
  ): string | null {
    // 1. Structured country code / name passed directly
    if (structuredCountry) {
      const normalized = this.normalizeCountryCode(structuredCountry);
      if (normalized) return normalized;
    }

    // 2. Explicit restriction phrases in title, location, or description
    // e.g. "Must reside in Germany", "Remote - USA only", "عن بعد - السعودية فقط"
    const textSources = [location, title, description];
    for (const text of textSources) {
      if (!text) continue;
      const match = text.match(RemoteScopeClassifier.RESTRICTION_PHRASES_REGEX);
      if (match) {
        let rawCountry = (match[1] || match[2] || match[3] || match[4] || '').trim().toLowerCase();
        // Clean up common surrounding stop words like "only", "فقط", punctuation
        rawCountry = rawCountry
          .replace(/\b(?:only|residents?|residents? of)\b/gi, '')
          .replace(/[()[\]]/g, '')
          .replace(/(?:فقط|داخل)/g, '')
          .trim();
        const code = this.normalizeCountryCode(rawCountry);
        if (code) return code;
      }
    }

    // 3. Direct country token mention in location field (e.g. "Cairo, Egypt", "Berlin, Germany")
    if (location) {
      for (const [key, code] of Object.entries(RemoteScopeClassifier.COUNTRY_MAP)) {
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(location)) {
          return code;
        }
      }
    }

    // 4. Direct country token mention in title or description with restriction context
    const fullText = `${title} ${description}`.toLowerCase();
    for (const [key, code] of Object.entries(RemoteScopeClassifier.COUNTRY_MAP)) {
      // Must have restriction context if checking in broad description/title
      const pattern = new RegExp(
        `(?:\\b(?:reside in|based in|citizens? of|residents? of|only in|remote\\s*[-–—:]?\\s*)\\s*${key}\\b)|(?:\\b${key}\\s*(?:only|فقط)\\b)`,
        'i',
      );
      if (pattern.test(fullText)) {
        return code;
      }
    }

    return null;
  }

  /**
   * Normalizes country string or code into 2-letter uppercase ISO code.
   */
  private normalizeCountryCode(raw: string): string | null {
    const trimmed = raw.trim().toLowerCase();
    if (RemoteScopeClassifier.COUNTRY_MAP[trimmed]) {
      return RemoteScopeClassifier.COUNTRY_MAP[trimmed];
    }

    // Check uppercase ISO code directly (e.g. "DE", "US", "EG", "SA")
    const upper = raw.trim().toUpperCase();
    if (upper.length === 2 && Object.values(RemoteScopeClassifier.COUNTRY_MAP).includes(upper)) {
      return upper;
    }

    return null;
  }
}

export const remoteScopeClassifier = new RemoteScopeClassifier();
