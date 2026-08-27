import express from 'express';
import { errorHandler } from './shared/middleware/error.middleware.js';
import { responseFormatter } from './shared/middleware/response.middleware.js';

const app = express();

app.use(express.json());

app.use(responseFormatter);

app.get('/', (_req, res) => {
  res.success({
    message: 'AI Career Platform API is running',
  });
});

app.use(errorHandler);

export default app;
