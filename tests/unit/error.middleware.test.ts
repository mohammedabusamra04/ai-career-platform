import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/shared/middleware/error.middleware.js';
import { AppError } from '../../src/shared/errors/AppError.js';
import { StatusCodes } from 'http-status-codes';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  it('should handle AppError and return expected status and payload', () => {
    const error = AppError.badRequest('Invalid parameter');

    errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: false,
      code: StatusCodes.BAD_REQUEST,
      message: 'Invalid parameter',
      data: null,
      meta: {},
    });
  });

  it('should handle unexpected generic Error as internal server error', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: false,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      data: null,
      meta: {},
    });
  });
});
