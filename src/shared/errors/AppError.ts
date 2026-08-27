import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, StatusCodes.BAD_REQUEST);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, StatusCodes.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, StatusCodes.CONFLICT);
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, StatusCodes.FORBIDDEN);
  }
}
