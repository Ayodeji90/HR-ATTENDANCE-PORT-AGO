import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { leaveModel, LeaveRecord } from './leave.model';
import { employeeModel } from '@modules/employee/employee.model';
import { resolveEmployeeId } from '@middleware/ownership';
import { config } from '@config/index';
import * as notificationService from '@modules/notification/notification.service';

// ---------------------------------------------------------------------------
// Multer setup for supporting document uploads
// ---------------------------------------------------------------------------
const uploadDir = path.resolve(config.upload.dir, 'leave-documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage, limits: { fileSize: config.upload.maxFileSize } });

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const LEAVE_TYPES = ['annual', 'sick', 'casual', 'emergency', 'maternity', 'unpaid'] as const;

const createLeaveSchema = z.object({
  employee_id: z.string().uuid().optional(), // ignored for employee-role callers; see resolveEmployeeId
  leave_type: z.enum(LEAVE_TYPES),
  start_date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid start_date' }),
  end_date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid end_date' }),
  half_day: z.boolean().optional(),
  reason: z.string().optional(),
});

const decisionSchema = z.object({
  comment: z.string().optional(),
});

function computeDurationDays(startDate: string, endDate: string, halfDay: boolean): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (diffDays <= 0) throw new AppError('end_date must be on or after start_date', 400, 'INVALID_DATE_RANGE');
  return halfDay ? diffDays - 0.5 : diffDays;
}

/** Notify the employee (if they have a linked login account) of a leave decision */
async function notifyEmployee(leave: LeaveRecord, kind: 'approved' | 'rejected'): Promise<void> {
  const employee = await employeeModel.findById(leave.employee_id);
  if (!employee?.user_id) return;
  if (kind === 'approved') {
    await notificationService.leaveApprovedTrigger(employee.user_id, leave.id);
  } else {
    await notificationService.leaveRejectedTrigger(employee.user_id, leave.id, leave.rejection_reason ?? undefined);
  }
}

/** Submit a new leave request (self‑service) */
export async function submitLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = createLeaveSchema.parse(req.body);
    const employeeId = await resolveEmployeeId(req, payload.employee_id);

    const employee = await employeeModel.findById(employeeId);
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

    const durationDays = computeDurationDays(payload.start_date, payload.end_date, payload.half_day ?? false);

    const record = await leaveModel.create({
      employee_id: employeeId,
      leave_type: payload.leave_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      duration_days: durationDays,
      half_day: payload.half_day,
      reason: payload.reason,
    });
    logger.info('Leave request submitted', { leaveId: record.id, employeeId });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** Supervisor stage: pending -> approved_by_supervisor | rejected */
export async function supervisorApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { comment } = decisionSchema.parse(req.body);
    const existing = await leaveModel.findById(id);
    if (!existing) throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
    if (existing.status !== 'pending') {
      throw new AppError(`Leave request is not awaiting supervisor decision (status: ${existing.status})`, 409, 'INVALID_LEAVE_STATE');
    }
    const decision = req.path.includes('reject') ? 'rejected' : 'approved_by_supervisor';
    const record = await leaveModel.supervisorDecide(id, decision, req.user!.userId, comment);
    logger.info(`Leave ${decision} by supervisor`, { leaveId: id, supervisorId: req.user!.userId });
    if (decision === 'rejected') await notifyEmployee(record, 'rejected');
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** HR final stage: approved_by_supervisor -> approved_by_hr | rejected */
export async function hrApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { comment } = decisionSchema.parse(req.body);
    const existing = await leaveModel.findById(id);
    if (!existing) throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
    if (existing.status !== 'approved_by_supervisor') {
      throw new AppError(
        `Leave request must be approved by a supervisor before HR can act (status: ${existing.status})`,
        409,
        'INVALID_LEAVE_STATE',
      );
    }
    const decision = req.path.includes('reject') ? 'rejected' : 'approved_by_hr';
    const record = await leaveModel.hrDecide(id, decision, req.user!.userId, comment);
    logger.info(`Leave ${decision} by HR`, { leaveId: id, hrId: req.user!.userId });
    await notifyEmployee(record, decision === 'approved_by_hr' ? 'approved' : 'rejected');
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** Attach a supporting document to a leave request */
export const uploadDocument = [
  upload.single('document'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError('No document uploaded', 400, 'NO_FILE');
      const existing = await leaveModel.findById(id);
      if (!existing) throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      const documentPath = path.relative(process.cwd(), req.file.path);
      const record = await leaveModel.attachDocument(id, documentPath);
      logger.info('Leave document attached', { leaveId: id });
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },
];

/** Get leave history for an employee */
export async function employeeLeaveHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId } = req.params;
    const result = await leaveModel.list({ employeeId });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Get pending leave approvals (admin/HR/supervisor) */
export async function pendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query as any;
    const result = await leaveModel.list({ status: status || 'pending' });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
