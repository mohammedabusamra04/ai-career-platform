import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  pipelineApiKey: process.env.PIPELINE_API_SECRET || '',
  jobRunTime1: process.env.JOB_RUN_TIME_1 || '09:00',
  jobRunTime2: process.env.JOB_RUN_TIME_2 || '18:00',
  timezone: process.env.TIMEZONE || 'Asia/Gaza',
  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  joobleApiKey: process.env.JOOBLE_API_KEY || '',
  rapidApiKey: process.env.RAPIDAPI_KEY || '',
};

export default env;
