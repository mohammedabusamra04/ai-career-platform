import type { Request, Response, NextFunction } from 'express';
import env from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

export function requirePipelineAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  let providedKey: string | undefined;

  if (typeof apiKeyHeader === 'string' && apiKeyHeader.trim()) {
    providedKey = apiKeyHeader.trim();
  } else if (typeof authHeader === 'string' && authHeader.trim()) {
    const parts = authHeader.trim().split(' ');
    providedKey =
      parts.length === 2 && parts[0]?.toLowerCase() === 'bearer' ? parts[1] : authHeader.trim();
  }

  const expectedKey = env.pipelineApiKey?.trim();

  if (!expectedKey || !providedKey || providedKey !== expectedKey) {
    next(AppError.unauthorized('Unauthorized: Invalid or missing API key'));
    return;
  }

  next();
}
