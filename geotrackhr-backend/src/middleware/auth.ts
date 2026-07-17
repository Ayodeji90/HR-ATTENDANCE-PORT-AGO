import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '@config/auth';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';

/**
 * JWT payload structure stored in access tokens.
 * Minimal — only what's needed for authorization decisions.
 */
export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

/**
 * Extend Express Request to include authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT Authentication Middleware.
 *
 * Verifies the Bearer token from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * On failure, returns 401 with a structured error.
 *
 * This middleware does NOT check roles — that's the RBAC middleware's job.
 * Separation of concerns: auth = "who are you?", rbac = "are you allowed?"
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Authentication required — no token provided', 401, 'NO_TOKEN');
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : parts[0];

  if (!token || token.length === 0) {
    throw new AppError('Authentication required — empty token', 401, 'EMPTY_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret) as JwtPayload;

    // Validate payload shape
    if (!decoded.userId || !decoded.role) {
      throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN_PAYLOAD');
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired — please refresh', 401, 'TOKEN_EXPIRED');
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token — signature verification failed', 401, 'INVALID_TOKEN');
    }

    logger.error('Unexpected JWT verification error', { error: (err as Error).message });
    throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
  }
}