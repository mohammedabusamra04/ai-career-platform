import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function responseFormatter(_req: Request, res: Response, next: NextFunction): void {
  res.success = (options = {}) => {
    const code = options.code ?? StatusCodes.OK;

    return res.status(code).json({
      status: true,
      code,
      message: options.message ?? 'Success',
      data: options.data ?? null,
      meta: options.meta ?? {},
    });
  };

  res.fail = (options = {}) => {
    const code = options.code ?? StatusCodes.INTERNAL_SERVER_ERROR;

    return res.status(code).json({
      status: false,
      code,
      message: options.message ?? 'Error',
      data: null,
      meta: options.meta ?? {},
    });
  };

  next();
}
