import { describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

describe('AppError', () => {
  it('should initialize with custom message and status code', () => {
    const error = new AppError('Custom error', StatusCodes.PAYMENT_REQUIRED);

    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('AppError');
    expect(error.stack).toBeDefined();
  });

  it('should default to INTERNAL_SERVER_ERROR when no status code is passed', () => {
    const error = new AppError('Server error');

    expect(error.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(true);
  });

  it('should create a BadRequest error (400)', () => {
    const error = AppError.badRequest('Invalid input');

    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(error.isOperational).toBe(true);
  });

  it('should create a NotFound error (404)', () => {
    const defaultError = AppError.notFound();
    expect(defaultError.message).toBe('Resource not found');
    expect(defaultError.statusCode).toBe(StatusCodes.NOT_FOUND);

    const customError = AppError.notFound('User not found');
    expect(customError.message).toBe('User not found');
    expect(customError.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it('should create a Conflict error (409)', () => {
    const error = AppError.conflict('Email already exists');

    expect(error.message).toBe('Email already exists');
    expect(error.statusCode).toBe(StatusCodes.CONFLICT);
  });

  it('should create an Unauthorized error (401)', () => {
    const error = AppError.unauthorized('Invalid token');

    expect(error.message).toBe('Invalid token');
    expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('should create a Forbidden error (403)', () => {
    const error = AppError.forbidden('Access denied');

    expect(error.message).toBe('Access denied');
    expect(error.statusCode).toBe(StatusCodes.FORBIDDEN);
  });
});
