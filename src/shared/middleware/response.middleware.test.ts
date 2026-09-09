import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { responseFormatter } from './response.middleware.js';

describe('responseFormatter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    success?: (options?: unknown) => unknown;
    fail?: (options?: unknown) => unknown;
  };
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  it('should attach res.success and res.fail methods and call next()', () => {
    responseFormatter(mockReq as Request, mockRes as unknown as Response, nextFn);

    expect(typeof mockRes.success).toBe('function');
    expect(typeof mockRes.fail).toBe('function');
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  describe('res.success', () => {
    it('should format default success response with 200 OK', () => {
      responseFormatter(mockReq as Request, mockRes as unknown as Response, nextFn);

      mockRes.success!();

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: true,
        code: StatusCodes.OK,
        message: 'Success',
        data: null,
        meta: {},
      });
    });

    it('should format custom success response with custom code, message, data, and meta', () => {
      responseFormatter(mockReq as Request, mockRes as unknown as Response, nextFn);

      mockRes.success!({
        code: StatusCodes.CREATED,
        message: 'Resource created',
        data: { id: 1, title: 'Job' },
        meta: { page: 1, total: 10 },
      });

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: true,
        code: StatusCodes.CREATED,
        message: 'Resource created',
        data: { id: 1, title: 'Job' },
        meta: { page: 1, total: 10 },
      });
    });
  });

  describe('res.fail', () => {
    it('should format default fail response with 500 INTERNAL_SERVER_ERROR', () => {
      responseFormatter(mockReq as Request, mockRes as unknown as Response, nextFn);

      mockRes.fail!();

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: false,
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Error',
        data: null,
        meta: {},
      });
    });

    it('should format custom fail response with custom code, message, and meta', () => {
      responseFormatter(mockReq as Request, mockRes as unknown as Response, nextFn);

      mockRes.fail!({
        code: StatusCodes.BAD_REQUEST,
        message: 'Validation failed',
        meta: { field: 'jobTitle' },
      });

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: false,
        code: StatusCodes.BAD_REQUEST,
        message: 'Validation failed',
        data: null,
        meta: { field: 'jobTitle' },
      });
    });
  });
});
