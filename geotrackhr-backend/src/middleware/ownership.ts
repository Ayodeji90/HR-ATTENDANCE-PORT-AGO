import { Request, Response, NextFunction } from 'express';
import { AppError } from '@middleware/errorHandler';
import { employeeModel } from '@modules/employee/employee.model';

const TRUSTED_ROLES = ['admin', 'hr', 'supervisor'];

/**
 * For employee-role users, resolves their own linked employee record and
 * rejects with 403 if the route's :employeeId param (or body.employee_id)
 * refers to someone else. admin/hr/supervisor bypass — they can view/act on
 * any employee's records.
 *
 * Must be used after `authenticate`.
 */
export function requireSelfOrRole(...roles: string[]) {
  const trusted = roles.length ? roles : TRUSTED_ROLES;
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Authentication required', 401, 'NO_USER_CONTEXT');
      if (trusted.includes(req.user.role)) {
        next();
        return;
      }
      const employee = await employeeModel.findByUserId(req.user.userId);
      if (!employee) {
        throw new AppError('No employee record linked to this account', 403, 'NO_LINKED_EMPLOYEE');
      }
      const targetId = req.params.employeeId || (req.query.employeeId as string | undefined) || req.body?.employee_id;
      if (targetId && targetId !== employee.id) {
        throw new AppError('Access denied — you can only access your own records', 403, 'FORBIDDEN');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resolves the effective employee_id for a self-service write (check-in,
 * leave submission, etc). Trusted roles may act on behalf of any
 * employee_id supplied in the request body. employee-role callers are
 * always forced to their own linked employee record, regardless of what
 * the body claims — closes the attendance/leave spoofing hole where any
 * authenticated employee could act as any other employee_id.
 */
export async function resolveEmployeeId(req: Request, bodyEmployeeId?: string): Promise<string> {
  if (!req.user) throw new AppError('Authentication required', 401, 'NO_USER_CONTEXT');
  if (TRUSTED_ROLES.includes(req.user.role)) {
    if (!bodyEmployeeId) throw new AppError('employee_id is required', 400, 'MISSING_EMPLOYEE_ID');
    return bodyEmployeeId;
  }
  const employee = await employeeModel.findByUserId(req.user.userId);
  if (!employee) throw new AppError('No employee record linked to this account', 403, 'NO_LINKED_EMPLOYEE');
  return employee.id;
}
