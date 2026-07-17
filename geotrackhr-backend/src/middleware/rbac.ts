import { Request, Response, NextFunction } from 'express';
import { AppError } from '@middleware/errorHandler';

/**
 * Role-Based Access Control (RBAC) Middleware Factory.
 *
 * Returns middleware that checks if the authenticated user's role
 * is in the allowed list. Must be used AFTER the authenticate middleware
 * (which sets req.user).
 *
 * Usage:
 *   router.post('/', authenticate, requireRole('admin', 'hr'), handler);
 *   router.get('/',  authenticate, requireRole('admin', 'hr', 'supervisor', 'employee'), handler);
 *
 * Role hierarchy (for reference):
 *   admin      — full system access, user management
 *   hr         — employee management, leave approvals, reports
 *   supervisor — site-level management, attendance approvals
 *   employee   — self-service (check-in/out, leave requests)
 */

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Must be used after authenticate middleware
    if (!req.user) {
      throw new AppError(
        'Authentication required before role check',
        401,
        'NO_USER_CONTEXT'
      );
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError(
        `Access denied — role '${userRole}' is not authorized for this resource`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

/**
 * Convenience presets for common role combinations.
 */

/** Admin only — user management, system config */
export const adminOnly = requireRole('admin');

/** Admin + HR — employee management, leave final approval */
export const adminOrHR = requireRole('admin', 'hr');

/** Admin + HR + Supervisor — attendance approval, site management */
export const management = requireRole('admin', 'hr', 'supervisor');

/** All authenticated users — self-service endpoints */
export const allRoles = requireRole('admin', 'hr', 'supervisor', 'employee');