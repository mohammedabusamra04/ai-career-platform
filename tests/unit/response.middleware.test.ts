import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { responseFormatter } from '../../src/shared/middleware/response.middleware.js';

describe('responseFormatter middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    success?: (data: unknown, statusCode?: number) => void;
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

  it('should attach res.success helper to response', () => {
    responseFormatter(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(typeof mockResponse.success).toBe('function');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should format success responses properly', () => {
    responseFormatter(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    mockResponse.success!({ data: { message: 'OK' } });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: true,
      code: 200,
      message: 'Success',
      data: { message: 'OK' },
      meta: {},
    });
  });
});
