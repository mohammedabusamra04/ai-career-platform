import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { errorHandler } from './error.middleware.js';
import { AppError } from '../errors/AppError.js';
import logger from '../utils/logger.js';

vi.mock('../utils/logger.js', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: {
    fail: ReturnType<typeof vi.fn>;
  };
  let nextFn: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {};
    mockRes = {
      fail: vi.fn(),
    };
    nextFn = vi.fn();
  });

  it('should handle AppError and respond with corresponding status code and message', () => {
    const error = AppError.badRequest('Invalid preference input');

    errorHandler(error, mockReq as Request, mockRes as unknown as Response, nextFn);

    expect(mockRes.fail).toHaveBeenCalledWith({
      code: StatusCodes.BAD_REQUEST,
      message: 'Invalid preference input',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should handle standard generic Error, log it, and respond with 500 Internal Server Error', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, mockReq as Request, mockRes as unknown as Response, nextFn);

    expect(logger.error).toHaveBeenCalledWith('Database connection failed');
    expect(mockRes.fail).toHaveBeenCalledWith({
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });

  it('should handle non-Error thrown objects, log "Unknown error", and respond with 500', () => {
    const error = 'some string error';

    errorHandler(error, mockReq as Request, mockRes as unknown as Response, nextFn);

    expect(logger.error).toHaveBeenCalledWith('Unknown error');
    expect(mockRes.fail).toHaveBeenCalledWith({
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
