import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requirePipelineAuth } from './auth.middleware.js';
import env from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

describe('requirePipelineAuth middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    env.pipelineApiKey = 'test-secret-key';
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = vi.fn();
  });

  it('should call next() with AppError.unauthorized when no credentials provided', () => {
    requirePipelineAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = vi.mocked(nextFunction).mock.calls[0][0] as unknown as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Unauthorized');
  });

  it('should call next() with AppError.unauthorized when x-api-key is invalid', () => {
    mockRequest.headers = {
      'x-api-key': 'wrong-key',
    };

    requirePipelineAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = vi.mocked(nextFunction).mock.calls[0][0] as unknown as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('should call next() without error when valid x-api-key is provided', () => {
    mockRequest.headers = {
      'x-api-key': 'test-secret-key',
    };

    requirePipelineAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next() without error when valid Bearer token is provided', () => {
    mockRequest.headers = {
      authorization: 'Bearer test-secret-key',
    };

    requirePipelineAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next() with AppError.unauthorized when env.pipelineApiKey is empty', () => {
    env.pipelineApiKey = '';
    mockRequest.headers = {
      'x-api-key': 'test-secret-key',
    };

    requirePipelineAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });
});
