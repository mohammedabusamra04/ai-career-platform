import {
  Specialization,
  RemoteScope,
  ExperienceLevel,
  WorkType,
} from '@prisma/client';
import type { Job } from '../job.types.js';
import {
  NegativeExclusionMatcher,
  negativeExclusionMatcher,
  type ExclusionResult,
} from './negative-exclusion.matcher.js';

export { NegativeExclusionMatcher, negativeExclusionMatcher, type ExclusionResult };

export interface TitleClassificationResult {
  primarySpecialization: Specialization;
  secondarySpecialization: Specialization | null;
  confidence: number;
  classificationMethod: 'RULE_TITLE';
  matchedTokens: string[];
}

export interface ClassificationResult {
  primarySpecialization: Specialization | null;
  secondarySpecialization: Specialization | null;
  remoteScope: RemoteScope;
  experienceLevel: ExperienceLevel;
  workType: WorkType;
  confidence: number;
  classificationMethod: 'RULE_TITLE' | 'RULE_DESCRIPTION' | 'AI_FALLBACK' | 'DEFAULT' | 'NEGATIVE_EXCLUSION';
  matchedTokens?: string[];
  isExcluded?: boolean;
  exclusionReason?: string;
}

interface TokenEntry {
  spec: Specialization;
  weight: number;
  isDirectRole: boolean;
}

export class DeterministicJobClassifier {
  constructor(
    private readonly exclusionMatcher: NegativeExclusionMatcher = negativeExclusionMatcher,
  ) {}

  /**
   * Pre-compiled Token Map for Title-First O(k) Classification (TASK-30.1).
   * Maps normalized n-grams (1-gram, 2-gram, 3-gram) to their specialization and weight.
   */
  private static readonly TOKEN_MAP: Map<string, TokenEntry> = new Map([
    // ==========================================
    // BACKEND (Includes Rust, Go, Node, C#, Java, PHP, Python, etc.)
    // ==========================================
    ['backend', { spec: Specialization.BACKEND, weight: 100, isDirectRole: true }],
    ['back-end', { spec: Specialization.BACKEND, weight: 100, isDirectRole: true }],
    ['back end', { spec: Specialization.BACKEND, weight: 100, isDirectRole: true }],
    ['backend developer', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['backend engineer', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['مطور خلفي', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['مهندس خلفية', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['باك اند', { spec: Specialization.BACKEND, weight: 100, isDirectRole: true }],
    ['مبرمج باك اند', { spec: Specialization.BACKEND, weight: 100, isDirectRole: true }],
    ['rust', { spec: Specialization.BACKEND, weight: 80, isDirectRole: false }],
    ['rustlang', { spec: Specialization.BACKEND, weight: 80, isDirectRole: false }],
    ['rust developer', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['rust engineer', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['golang', { spec: Specialization.BACKEND, weight: 80, isDirectRole: false }],
    ['go developer', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['go engineer', { spec: Specialization.BACKEND, weight: 110, isDirectRole: true }],
    ['node.js', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['nodejs', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['express', { spec: Specialization.BACKEND, weight: 70, isDirectRole: false }],
    ['express.js', { spec: Specialization.BACKEND, weight: 70, isDirectRole: false }],
    ['nest.js', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['nestjs', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['django', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['fastapi', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['flask', { spec: Specialization.BACKEND, weight: 70, isDirectRole: false }],
    ['spring boot', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['springboot', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['laravel', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['symfony', { spec: Specialization.BACKEND, weight: 70, isDirectRole: false }],
    ['c#', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['.net', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['dotnet', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['asp.net', { spec: Specialization.BACKEND, weight: 75, isDirectRole: false }],
    ['java developer', { spec: Specialization.BACKEND, weight: 95, isDirectRole: true }],
    ['java engineer', { spec: Specialization.BACKEND, weight: 95, isDirectRole: true }],
    ['php developer', { spec: Specialization.BACKEND, weight: 95, isDirectRole: true }],
    ['php engineer', { spec: Specialization.BACKEND, weight: 95, isDirectRole: true }],
    ['ruby on rails', { spec: Specialization.BACKEND, weight: 80, isDirectRole: false }],
    ['rails developer', { spec: Specialization.BACKEND, weight: 95, isDirectRole: true }],
    ['api developer', { spec: Specialization.BACKEND, weight: 85, isDirectRole: true }],
    ['api engineer', { spec: Specialization.BACKEND, weight: 85, isDirectRole: true }],

    // ==========================================
    // FRONTEND (React, Vue, Angular, Next, Tailwind, UI)
    // ==========================================
    ['frontend', { spec: Specialization.FRONTEND, weight: 100, isDirectRole: true }],
    ['front-end', { spec: Specialization.FRONTEND, weight: 100, isDirectRole: true }],
    ['front end', { spec: Specialization.FRONTEND, weight: 100, isDirectRole: true }],
    ['frontend developer', { spec: Specialization.FRONTEND, weight: 110, isDirectRole: true }],
    ['frontend engineer', { spec: Specialization.FRONTEND, weight: 110, isDirectRole: true }],
    ['مطور واجهات', { spec: Specialization.FRONTEND, weight: 110, isDirectRole: true }],
    ['مهندس واجهات', { spec: Specialization.FRONTEND, weight: 110, isDirectRole: true }],
    ['فرونت اند', { spec: Specialization.FRONTEND, weight: 100, isDirectRole: true }],
    ['مبرمج فرونت اند', { spec: Specialization.FRONTEND, weight: 100, isDirectRole: true }],
    ['react', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['react.js', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['reactjs', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['react developer', { spec: Specialization.FRONTEND, weight: 105, isDirectRole: true }],
    ['vue', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['vue.js', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['vuejs', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['vue developer', { spec: Specialization.FRONTEND, weight: 105, isDirectRole: true }],
    ['angular', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['angular.js', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['angularjs', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['angular developer', { spec: Specialization.FRONTEND, weight: 105, isDirectRole: true }],
    ['next.js', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['nextjs', { spec: Specialization.FRONTEND, weight: 75, isDirectRole: false }],
    ['nuxt', { spec: Specialization.FRONTEND, weight: 70, isDirectRole: false }],
    ['nuxt.js', { spec: Specialization.FRONTEND, weight: 70, isDirectRole: false }],
    ['nuxtjs', { spec: Specialization.FRONTEND, weight: 70, isDirectRole: false }],
    ['svelte', { spec: Specialization.FRONTEND, weight: 70, isDirectRole: false }],
    ['tailwind', { spec: Specialization.FRONTEND, weight: 60, isDirectRole: false }],
    ['tailwindcss', { spec: Specialization.FRONTEND, weight: 60, isDirectRole: false }],
    ['css3', { spec: Specialization.FRONTEND, weight: 55, isDirectRole: false }],
    ['web designer', { spec: Specialization.FRONTEND, weight: 85, isDirectRole: true }],

    // ==========================================
    // FULLSTACK (Fullstack, MERN, MEAN)
    // ==========================================
    ['fullstack', { spec: Specialization.FULLSTACK, weight: 120, isDirectRole: true }],
    ['full-stack', { spec: Specialization.FULLSTACK, weight: 120, isDirectRole: true }],
    ['full stack', { spec: Specialization.FULLSTACK, weight: 120, isDirectRole: true }],
    ['fullstack developer', { spec: Specialization.FULLSTACK, weight: 130, isDirectRole: true }],
    ['fullstack engineer', { spec: Specialization.FULLSTACK, weight: 130, isDirectRole: true }],
    ['فول ستاك', { spec: Specialization.FULLSTACK, weight: 120, isDirectRole: true }],
    ['مطور شامل', { spec: Specialization.FULLSTACK, weight: 120, isDirectRole: true }],
    ['mern', { spec: Specialization.FULLSTACK, weight: 80, isDirectRole: false }],
    ['mean', { spec: Specialization.FULLSTACK, weight: 80, isDirectRole: false }],

    // ==========================================
    // MOBILE (Flutter, React Native, iOS, Android, Swift, Kotlin)
    // ==========================================
    ['mobile', { spec: Specialization.MOBILE, weight: 95, isDirectRole: true }],
    ['mobile developer', { spec: Specialization.MOBILE, weight: 115, isDirectRole: true }],
    ['mobile engineer', { spec: Specialization.MOBILE, weight: 115, isDirectRole: true }],
    ['مطور تطبيقات', { spec: Specialization.MOBILE, weight: 115, isDirectRole: true }],
    ['مهندس تطبيقات', { spec: Specialization.MOBILE, weight: 115, isDirectRole: true }],
    ['تطبيقات الجوال', { spec: Specialization.MOBILE, weight: 105, isDirectRole: true }],
    ['مطور موبايل', { spec: Specialization.MOBILE, weight: 115, isDirectRole: true }],
    ['ايفون', { spec: Specialization.MOBILE, weight: 85, isDirectRole: false }],
    ['flutter', { spec: Specialization.MOBILE, weight: 85, isDirectRole: false }],
    ['flutter developer', { spec: Specialization.MOBILE, weight: 110, isDirectRole: true }],
    ['react native', { spec: Specialization.MOBILE, weight: 85, isDirectRole: false }],
    ['react-native', { spec: Specialization.MOBILE, weight: 85, isDirectRole: false }],
    ['ios', { spec: Specialization.MOBILE, weight: 80, isDirectRole: false }],
    ['ios developer', { spec: Specialization.MOBILE, weight: 110, isDirectRole: true }],
    ['ios engineer', { spec: Specialization.MOBILE, weight: 110, isDirectRole: true }],
    ['android', { spec: Specialization.MOBILE, weight: 80, isDirectRole: false }],
    ['android developer', { spec: Specialization.MOBILE, weight: 110, isDirectRole: true }],
    ['android engineer', { spec: Specialization.MOBILE, weight: 110, isDirectRole: true }],
    ['swift', { spec: Specialization.MOBILE, weight: 80, isDirectRole: false }],
    ['swift developer', { spec: Specialization.MOBILE, weight: 100, isDirectRole: true }],
    ['kotlin', { spec: Specialization.MOBILE, weight: 80, isDirectRole: false }],
    ['kotlin developer', { spec: Specialization.MOBILE, weight: 100, isDirectRole: true }],

    // ==========================================
    // DEVOPS (SRE, Kubernetes, Docker, Terraform, Cloud, AWS, CI/CD)
    // ==========================================
    ['devops', { spec: Specialization.DEVOPS, weight: 110, isDirectRole: true }],
    ['devops engineer', { spec: Specialization.DEVOPS, weight: 120, isDirectRole: true }],
    ['sre', { spec: Specialization.DEVOPS, weight: 110, isDirectRole: true }],
    ['site reliability', { spec: Specialization.DEVOPS, weight: 110, isDirectRole: true }],
    ['site reliability engineer', { spec: Specialization.DEVOPS, weight: 120, isDirectRole: true }],
    ['cloud engineer', { spec: Specialization.DEVOPS, weight: 110, isDirectRole: true }],
    ['platform engineer', { spec: Specialization.DEVOPS, weight: 105, isDirectRole: true }],
    ['infrastructure engineer', { spec: Specialization.DEVOPS, weight: 105, isDirectRole: true }],
    ['sysadmin', { spec: Specialization.DEVOPS, weight: 95, isDirectRole: true }],
    ['systems administrator', { spec: Specialization.DEVOPS, weight: 95, isDirectRole: true }],
    ['مهندس سحابي', { spec: Specialization.DEVOPS, weight: 110, isDirectRole: true }],
    ['ديف اوبس', { spec: Specialization.DEVOPS, weight: 100, isDirectRole: true }],
    ['kubernetes', { spec: Specialization.DEVOPS, weight: 75, isDirectRole: false }],
    ['k8s', { spec: Specialization.DEVOPS, weight: 75, isDirectRole: false }],
    ['docker', { spec: Specialization.DEVOPS, weight: 65, isDirectRole: false }],
    ['terraform', { spec: Specialization.DEVOPS, weight: 75, isDirectRole: false }],
    ['ci/cd', { spec: Specialization.DEVOPS, weight: 70, isDirectRole: false }],

    // ==========================================
    // UIUX (UI/UX, Product Designer, Figma)
    // ==========================================
    ['ui/ux', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['ux/ui', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['ui ux', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['ux ui', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['product designer', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['ui designer', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['ux designer', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['user experience', { spec: Specialization.UIUX, weight: 95, isDirectRole: true }],
    ['interaction designer', { spec: Specialization.UIUX, weight: 100, isDirectRole: true }],
    ['مصمم واجهات', { spec: Specialization.UIUX, weight: 110, isDirectRole: true }],
    ['تجربة المستخدم', { spec: Specialization.UIUX, weight: 105, isDirectRole: true }],
    ['figma', { spec: Specialization.UIUX, weight: 70, isDirectRole: false }],

    // ==========================================
    // DATA (Data Engineer, Data Analyst, BI, SQL, ETL)
    // ==========================================
    ['data engineer', { spec: Specialization.DATA, weight: 110, isDirectRole: true }],
    ['data analyst', { spec: Specialization.DATA, weight: 110, isDirectRole: true }],
    ['data scientist', { spec: Specialization.DATA, weight: 110, isDirectRole: true }],
    ['bi engineer', { spec: Specialization.DATA, weight: 105, isDirectRole: true }],
    ['bi developer', { spec: Specialization.DATA, weight: 105, isDirectRole: true }],
    ['analytics engineer', { spec: Specialization.DATA, weight: 110, isDirectRole: true }],
    ['sql developer', { spec: Specialization.DATA, weight: 100, isDirectRole: true }],
    ['sql', { spec: Specialization.DATA, weight: 70, isDirectRole: false }],
    ['database developer', { spec: Specialization.DATA, weight: 100, isDirectRole: true }],
    ['database administrator', { spec: Specialization.DATA, weight: 100, isDirectRole: true }],
    ['قواعد بيانات', { spec: Specialization.DATA, weight: 85, isDirectRole: false }],
    ['etl', { spec: Specialization.DATA, weight: 70, isDirectRole: false }],
    ['big data', { spec: Specialization.DATA, weight: 75, isDirectRole: false }],
    ['مهندس بيانات', { spec: Specialization.DATA, weight: 110, isDirectRole: true }],
    ['محلل بيانات', { spec: Specialization.DATA, weight: 110, isDirectRole: true }],
    ['علم البيانات', { spec: Specialization.DATA, weight: 105, isDirectRole: true }],

    // ==========================================
    // QA (QA, Tester, Test Automation, SDET, Cypress, Playwright)
    // ==========================================
    ['qa', { spec: Specialization.QA, weight: 100, isDirectRole: true }],
    ['qa engineer', { spec: Specialization.QA, weight: 115, isDirectRole: true }],
    ['quality assurance', { spec: Specialization.QA, weight: 115, isDirectRole: true }],
    ['test automation', { spec: Specialization.QA, weight: 110, isDirectRole: true }],
    ['test engineer', { spec: Specialization.QA, weight: 105, isDirectRole: true }],
    ['tester', { spec: Specialization.QA, weight: 90, isDirectRole: true }],
    ['sdet', { spec: Specialization.QA, weight: 120, isDirectRole: true }],
    ['software test', { spec: Specialization.QA, weight: 100, isDirectRole: true }],
    ['qc engineer', { spec: Specialization.QA, weight: 100, isDirectRole: true }],
    ['qc', { spec: Specialization.QA, weight: 85, isDirectRole: false }],
    ['فاحص برمجيات', { spec: Specialization.QA, weight: 110, isDirectRole: true }],
    ['ضمان الجودة', { spec: Specialization.QA, weight: 110, isDirectRole: true }],
    ['selenium', { spec: Specialization.QA, weight: 70, isDirectRole: false }],
    ['cypress', { spec: Specialization.QA, weight: 70, isDirectRole: false }],
    ['playwright', { spec: Specialization.QA, weight: 70, isDirectRole: false }],

    // ==========================================
    // SECURITY (Cybersecurity, Infosec, Penetration Tester, AppSec)
    // ==========================================
    ['cybersecurity', { spec: Specialization.SECURITY, weight: 115, isDirectRole: true }],
    ['infosec', { spec: Specialization.SECURITY, weight: 105, isDirectRole: true }],
    ['penetration tester', { spec: Specialization.SECURITY, weight: 120, isDirectRole: true }],
    ['pentester', { spec: Specialization.SECURITY, weight: 110, isDirectRole: true }],
    ['soc analyst', { spec: Specialization.SECURITY, weight: 110, isDirectRole: true }],
    ['security engineer', { spec: Specialization.SECURITY, weight: 120, isDirectRole: true }],
    ['appsec', { spec: Specialization.SECURITY, weight: 110, isDirectRole: true }],
    ['أمن سيبراني', { spec: Specialization.SECURITY, weight: 115, isDirectRole: true }],
    ['أمن معلومات', { spec: Specialization.SECURITY, weight: 115, isDirectRole: true }],

    // ==========================================
    // AI_ENGINEER (Machine Learning, NLP, LLM, Deep Learning, AI)
    // ==========================================
    ['ai engineer', { spec: Specialization.AI_ENGINEER, weight: 125, isDirectRole: true }],
    ['ai developer', { spec: Specialization.AI_ENGINEER, weight: 120, isDirectRole: true }],
    ['machine learning', { spec: Specialization.AI_ENGINEER, weight: 110, isDirectRole: true }],
    ['machine learning engineer', { spec: Specialization.AI_ENGINEER, weight: 130, isDirectRole: true }],
    ['ml engineer', { spec: Specialization.AI_ENGINEER, weight: 120, isDirectRole: true }],
    ['deep learning', { spec: Specialization.AI_ENGINEER, weight: 105, isDirectRole: true }],
    ['nlp', { spec: Specialization.AI_ENGINEER, weight: 80, isDirectRole: false }],
    ['llm', { spec: Specialization.AI_ENGINEER, weight: 80, isDirectRole: false }],
    ['computer vision', { spec: Specialization.AI_ENGINEER, weight: 105, isDirectRole: true }],
    ['prompt engineer', { spec: Specialization.AI_ENGINEER, weight: 100, isDirectRole: true }],
    ['artificial intelligence', { spec: Specialization.AI_ENGINEER, weight: 105, isDirectRole: true }],
    ['ذكاء اصطناعي', { spec: Specialization.AI_ENGINEER, weight: 115, isDirectRole: true }],
    ['تعلم الآلة', { spec: Specialization.AI_ENGINEER, weight: 110, isDirectRole: true }],
  ]);

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
        /\b(?:backend|back-end|back end|rust|golang|node(?:\.js)?|python|java|php|ruby|\.net|c#|laravel|django|spring boot|api engineer|api developer)\b/i,
      skillsRegex: /\b(?:rust|node\.js|express|nest\.js|python|fastapi|django|golang|java|spring|c#|\.net|php|laravel|postgres|mongodb|redis)\b/i,
      weight: 8,
    },
  ];

  /**
   * Evaluates title against negative exclusion patterns (TASK-30.2).
   */
  public evaluateExclusion(title: string): ExclusionResult {
    return this.exclusionMatcher.evaluate(title);
  }

  /**
   * Title-First Tokenized Rule Engine (TASK-30.1 & TASK-30.2).
   * Fast O(k) evaluation over title n-grams (3-gram, 2-gram, 1-gram) with Map lookups.
   * Prior to positive matching, evaluates explicit negative exclusions.
   * Execution time <0.1ms per title.
   */
  public classifyTitle(title: string): TitleClassificationResult | null {
    if (!title || !title.trim()) {
      return null;
    }

    // 0. Prior Negative Exclusion Check (TASK-30.2)
    const exclusion = this.exclusionMatcher.evaluate(title);
    if (exclusion.isExcluded) {
      return null;
    }

    // 1. Normalize title preserving special programming tokens (.net, c#, c++, ui/ux, node.js, etc.)
    const normalized = this.normalizeTitleForTokens(title);
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return null;
    }

    const scores = new Map<Specialization, number>();
    const matchedTokens: string[] = [];

    // 2. Scan n-grams: 3-grams, 2-grams, 1-grams
    for (let i = 0; i < words.length; i++) {
      // 3-gram
      if (i + 2 < words.length) {
        const triGram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        const entry = DeterministicJobClassifier.TOKEN_MAP.get(triGram);
        if (entry) {
          scores.set(entry.spec, (scores.get(entry.spec) || 0) + entry.weight);
          matchedTokens.push(triGram);
        }
      }

      // 2-gram
      if (i + 1 < words.length) {
        const biGram = `${words[i]} ${words[i + 1]}`;
        const entry = DeterministicJobClassifier.TOKEN_MAP.get(biGram);
        if (entry) {
          scores.set(entry.spec, (scores.get(entry.spec) || 0) + entry.weight);
          matchedTokens.push(biGram);
        }
      }

      // 1-gram
      const uniGram = words[i];
      const entry = DeterministicJobClassifier.TOKEN_MAP.get(uniGram);
      if (entry) {
        scores.set(entry.spec, (scores.get(entry.spec) || 0) + entry.weight);
        matchedTokens.push(uniGram);
      }
    }

    if (scores.size === 0) {
      return null;
    }

    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const primarySpecialization = sorted[0][0];
    const secondarySpecialization =
      sorted.length > 1 && sorted[1][0] !== primarySpecialization ? sorted[1][0] : null;

    return {
      primarySpecialization,
      secondarySpecialization,
      confidence: 0.95,
      classificationMethod: 'RULE_TITLE',
      matchedTokens: Array.from(new Set(matchedTokens)),
    };
  }

  /**
   * Normalizes title for token matching while preserving programming symbols and compounds:
   * e.g., 'c#', '.net', 'node.js', 'vue.js', 'ui/ux', 'ci/cd'.
   */
  private normalizeTitleForTokens(title: string): string {
    let text = title.toLowerCase();

    // Preserve special tokens by substituting or safeguarding them
    text = text
      .replace(/\bc#\b/g, ' c# ')
      .replace(/\b\.net\b/g, ' .net ')
      .replace(/\bui\/ux\b/g, ' ui/ux ')
      .replace(/\bux\/ui\b/g, ' ux/ui ')
      .replace(/\bci\/cd\b/g, ' ci/cd ');

    // Replace brackets, slashes (except in protected tokens), parentheses, colons with spaces
    text = text.replace(/[/\\()[\]{},:;*!|•–—~"']/g, ' ');

    // Normalize dashes surrounded by spaces
    text = text.replace(/\s+-\s+/g, ' ');

    // Collapse multiple whitespace
    return text.trim();
  }

  public classify(job: Partial<Job>): ClassificationResult {
    const title = (job.title || '').trim();
    const description = (job.description || '').trim();
    const skillsText = Array.isArray(job.skills) ? job.skills.join(' ') : '';

    // 0. Prior Negative Exclusion Check (TASK-30.2)
    const exclusion = this.exclusionMatcher.evaluate(title);
    if (exclusion.isExcluded) {
      return {
        primarySpecialization: null,
        secondarySpecialization: null,
        remoteScope: RemoteScope.UNKNOWN,
        experienceLevel: ExperienceLevel.UNKNOWN,
        workType: WorkType.UNKNOWN,
        confidence: 1.0,
        classificationMethod: 'NEGATIVE_EXCLUSION',
        isExcluded: true,
        exclusionReason: exclusion.reason,
      };
    }

    // 1. Title-First Precedence (TASK-30.1)
    const titleMatch = this.classifyTitle(title);

    let primarySpecialization: Specialization;
    let secondarySpecialization: Specialization | null = null;
    let confidence: number;
    let classificationMethod: 'RULE_TITLE' | 'RULE_DESCRIPTION' | 'AI_FALLBACK' | 'DEFAULT';
    let matchedTokens: string[] | undefined = undefined;

    if (titleMatch) {
      primarySpecialization = titleMatch.primarySpecialization;
      secondarySpecialization = titleMatch.secondarySpecialization;
      confidence = titleMatch.confidence;
      classificationMethod = titleMatch.classificationMethod;
      matchedTokens = titleMatch.matchedTokens;
    } else {
      // Fallback: evaluate description and skills using rule weights
      const scores = new Map<Specialization, number>();

      for (const rule of DeterministicJobClassifier.SPECIALIZATION_RULES) {
        let score = 0;
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

      if (scores.size > 0) {
        const sortedSpecs = Array.from(scores.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([spec]) => spec);

        primarySpecialization = sortedSpecs[0];
        secondarySpecialization =
          sortedSpecs.length > 1 && sortedSpecs[1] !== primarySpecialization ? sortedSpecs[1] : null;
        confidence = 0.75;
        classificationMethod = 'RULE_DESCRIPTION';
      } else {
        primarySpecialization = Specialization.BACKEND;
        secondarySpecialization = null;
        confidence = 0.5;
        classificationMethod = 'DEFAULT';
      }
    }

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
      confidence,
      classificationMethod,
      matchedTokens,
      isExcluded: false,
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
