import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};

export default env;
