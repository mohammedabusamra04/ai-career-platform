import express from 'express';
import dotenv from 'dotenv';
import logger from './shared/utils/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  logger.info(`App is running on port ${port}`);
});
