import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError.js';
import logger from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.fail({
      code: err.statusCode,
      message: err.message,
    });

    return;
  }

  logger.error(err instanceof Error ? err.message : 'Unknown error');

  res.fail({
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  });
};
