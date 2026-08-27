import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
};

export default env;
