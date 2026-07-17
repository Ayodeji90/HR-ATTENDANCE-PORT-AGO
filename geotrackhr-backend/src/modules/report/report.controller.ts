import { Request, Response, NextFunction } from 'express';
import { AppError } from '@middleware/errorHandler';
import { attendanceModel } from '@modules/attendance/attendance.model';
import { leaveModel } from '@modules/leave/leave.model';
import { config } from '@config/index';

/** Daily attendance summary per site */
export async function dailyAttendanceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.query as any;
    if (!date) throw new AppError('Date query param required', 400, 'MISSING_DATE');
    // Simple aggregation: count punches per site for the given date
    const records = await attendanceModel.list({ date, limit: 10000 });
    const summary: Record<string, number> = {};
    for (const rec of records.data) {
      if (rec.site_id) {
        summary[rec.site_id] = (summary[rec.site_id] ?? 0) + 1;
      }
    }
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

/** Site attendance report – total punches for a site over a period */
export async function siteAttendanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { siteId, startDate, endDate } = req.query as any;
    if (!siteId || !startDate || !endDate) throw new AppError('siteId, startDate, endDate required', 400, 'MISSING_PARAMS');
    const records = await attendanceModel.list({ siteId, limit: 10000 });
    const filtered = records.data.filter((r) => r.event_date >= startDate && r.event_date <= endDate);
    const count = filtered.length;
    res.json({ success: true, data: { siteId, count, period: { startDate, endDate } } });
  } catch (err) {
    next(err);
  }
}

/** Employee attendance history (wrapper around the attendance module for reporting consistency) */
export async function employeeAttendanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId } = req.params;
    const result = await attendanceModel.list({ employeeId });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Monthly attendance summary for payroll export */
export async function monthlyAttendanceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { month, year } = req.query as any;
    if (!month || !year) throw new AppError('month and year required', 400, 'MISSING_PARAMS');
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const records = await attendanceModel.list({ limit: 100000 });
    const filtered = records.data.filter((r) => r.event_date.startsWith(prefix));
    // Simple aggregation per employee
    const summary: Record<string, number> = {};
    for (const rec of filtered) {
      summary[rec.employee_id] = (summary[rec.employee_id] ?? 0) + 1;
    }
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

/**
 * Leave balance report – remaining days per leave type for the current
 * calendar year, computed as the configured annual entitlement minus
 * duration_days already used in leaves that reached approved_by_hr.
 * 'unpaid' leave has no entitlement cap, so its balance is reported as null.
 */
export async function leaveBalanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId } = req.query as any;
    if (!employeeId) throw new AppError('employeeId required', 400, 'MISSING_EMPLOYEE');

    const currentYear = new Date().getFullYear();
    const leaves = await leaveModel.list({ employeeId, status: 'approved_by_hr', limit: 1000 });
    const usedByType: Record<string, number> = {};
    for (const leave of leaves.data) {
      if (new Date(leave.start_date).getFullYear() !== currentYear) continue;
      usedByType[leave.leave_type] = (usedByType[leave.leave_type] ?? 0) + Number(leave.duration_days);
    }

    const balance: Record<string, { entitlement: number | null; used: number; remaining: number | null }> = {};
    const types = new Set([...Object.keys(config.leave.entitlements), ...Object.keys(usedByType), 'unpaid']);
    for (const type of types) {
      const entitlement = config.leave.entitlements[type] ?? null;
      const used = usedByType[type] ?? 0;
      balance[type] = {
        entitlement,
        used,
        remaining: entitlement === null ? null : Math.max(entitlement - used, 0),
      };
    }

    res.json({ success: true, data: { employeeId, year: currentYear, balance } });
  } catch (err) {
    next(err);
  }
}
