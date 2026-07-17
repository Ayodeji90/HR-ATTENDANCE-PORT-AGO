import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';
import { ZodError } from 'zod';

/**
 * Custom application error class.
 * Extends Error with HTTP status code and optional error code
 * for structured API error responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware.
 *
 * Catches all errors thrown or passed via next(err) in the Express pipeline.
 * Returns a consistent JSON error response structure.
 *
 * Error types handled:
 * - AppError: our custom operational errors (known failures)
 * - ZodError: validation errors from request schemas
 * - SyntaxError: malformed JSON in request body
 * - Unknown errors: unexpected runtime errors (logged with stack trace)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── AppError (known operational errors) ──────────────
  if (err instanceof AppError) {
    logger.warn(`${err.code}: ${err.message}`, {
      statusCode: err.statusCode,
      code: err.code,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // ── Zod validation errors ────────────────────────────
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      issues: err.issues,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // ── Malformed JSON body ──────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  // ── Unknown / programmer errors ──────────────────────
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : err.message || 'An unexpected error occurred',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}