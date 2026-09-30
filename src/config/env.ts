import dotenv from 'dotenv';

dotenv.config();

/**
 * Supports either:
 *   GEMINI_API_KEY=xxxx
 * or multiple free-tier keys, each with its own separate daily quota:
 *   GEMINI_API_KEYS=key1,key2,key3
 *
 * GEMINI_API_KEYS takes priority when set. Falls back to GEMINI_API_KEY
 * (single key) for backward compatibility.
 */
function resolveGeminiApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS;

  if (multi) {
    return multi
      .split(',')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
  }

  const single = process.env.GEMINI_API_KEY || '';

  return single ? [single] : [];
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  /** @deprecated use geminiApiKeys — kept for any code still reading the single key. */
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiApiKeys: resolveGeminiApiKeys(),
  pipelineApiKey: process.env.PIPELINE_API_SECRET || '',
  jobRunTime1: process.env.JOB_RUN_TIME_1 || '09:00',
  jobRunTime2: process.env.JOB_RUN_TIME_2 || '21:00',
  timezone: process.env.TIMEZONE || 'Asia/Gaza',
  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  joobleApiKey: process.env.JOOBLE_API_KEY || '',
  rapidApiKey: process.env.RAPIDAPI_KEY || '',
  minMatchScore: Number(process.env.MIN_MATCH_SCORE) || 40,
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || '',
};

export default env;