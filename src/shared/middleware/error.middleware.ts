import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError.js';
import logger from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    if (typeof res.fail === 'function') {
      res.fail({
        code: err.statusCode,
        message: err.message,
      });
      return;
    }

    res.status(err.statusCode).json({
      status: false,
      code: err.statusCode,
      message: err.message,
      data: null,
      meta: {},
    });
    return;
  }

  logger.error(err instanceof Error ? err.message : 'Unknown error');

  if (typeof res.fail === 'function') {
    res.fail({
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
    return;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: false,
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    data: null,
    meta: {},
  });
};
