import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import knex from 'knex';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { employeeModel } from './employee.model';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { hashPassword } from '@utils/password';
import * as userModel from '@modules/auth/user.model';
import { knexfile } from '@database/knexfile';
import multer from 'multer';
import { config } from '@config/index';
import path from 'path';
import fs from 'fs';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

// ---------------------------------------------------------------------------
// Multer setup for passport photo uploads
// ---------------------------------------------------------------------------
const uploadDir = path.resolve(config.upload.dir, 'photos');
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
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Invalid file type – only JPEG/PNG allowed', 400, 'INVALID_FILE_TYPE'));
  },
});

// ---------------------------------------------------------------------------
// Validation schemas (Zod)
// ---------------------------------------------------------------------------
const employeeCreateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  date_of_birth: z.string().optional(), // ISO date string
  hire_date: z.string().optional(),
});

const employeeUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  hire_date: z.string().nullable().optional(),
  passport_photo_path: z.string().nullable().optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rejection_reason: z.string().nullable().optional(),
  approved_by: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Controller functions
// ---------------------------------------------------------------------------
/** GET /api/employees – list with pagination & filters */
export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, department, approval_status, is_active, search } = req.query as any;
    const result = await employeeModel.list({
      page: Number(page),
      limit: Number(limit),
      department,
      approval_status,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** GET /api/employees/me – the current user's linked employee record */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeModel.findByUserId(req.user!.userId);
    if (!employee) {
      throw new AppError('No employee record linked to this account', 404, 'NO_LINKED_EMPLOYEE');
    }
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

/** GET /api/employees/:id – fetch single employee */
export async function getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const employee = await employeeModel.findById(id);
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

/** POST /api/employees – create new employee (admin/HR) */
export async function createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = employeeCreateSchema.parse(req.body);
    // HR/admin creating an employee directly is an immediate approval, not
    // a self-registration — it must not land in the same pending queue as
    // POST /register (see selfRegister below).
    const employee = await employeeModel.create({
      ...payload,
      approval_status: 'approved',
      approved_by: req.user!.userId,
    } as any);
    logger.info('Employee created', { employeeId: employee.id });
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/employees/:id – update employee (admin/HR) */
export async function updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const payload = employeeUpdateSchema.parse(req.body);
    const employee = await employeeModel.update(id, payload);
    logger.info('Employee updated', { employeeId: id });
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/employees/:id – deactivate employee (admin/HR) */
export async function deactivateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await employeeModel.deactivate(id);
    logger.info('Employee deactivated', { employeeId: id });
    res.json({ success: true, data: { message: 'Employee deactivated' } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/employees/register – self‑registration (public) */
export const selfRegister = [
  upload.single('passport_photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = employeeCreateSchema.parse(req.body);
      const photoPath = req.file ? path.relative(process.cwd(), req.file.path) : undefined;
      const employee = await employeeModel.create({
        ...payload,
        passport_photo_path: photoPath,
        approval_status: 'pending',
      } as any);
      logger.info('Self‑registration submitted', { employeeId: employee.id });
      res.status(201).json({ success: true, data: { employeeId: employee.id, status: 'pending' } });
    } catch (err) {
      next(err);
    }
  },
];

/** POST /api/employees/:id/approve – approve registration (admin/HR) */
export async function approveEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const approverId = req.user!.userId;
    const employee = await employeeModel.approve(id, approverId);

    // Complete the self-registration loop: an approved employee with no
    // linked login account gets one created (role: employee) with a
    // system-generated temporary password. The password is returned in the
    // response so HR can relay it to the employee.
    let result = employee;
    let temporaryPassword: string | null = null;
    if (!employee.user_id && employee.email) {
      const employeeRole = await db('roles').where({ name: 'employee' }).first();
      if (employeeRole) {
        temporaryPassword = crypto.randomBytes(8).toString('base64url').slice(0, 12);
        const passwordHash = await hashPassword(temporaryPassword);
        const user = await userModel.createUser({
          role_id: employeeRole.id,
          email: employee.email,
          password_hash: passwordHash,
          full_name: `${employee.first_name} ${employee.last_name}`,
          phone: employee.phone ?? undefined,
        });
        result = await employeeModel.update(id, { user_id: user.id });
        logger.info('Login account created for approved employee', {
          employeeId: id,
          userId: user.id,
        });
      }
    }

    logger.info('Employee approved', { employeeId: id, approverId });
    res.json({
      success: true,
      data: { ...result, temporary_password: temporaryPassword },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/employees/:id/reject – reject registration (admin/HR) */
export async function rejectEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = rejectSchema.parse(req.body);
    const employee = await employeeModel.reject(id, reason);
    logger.info('Employee registration rejected', { employeeId: id, reason });
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

/** POST /api/employees/:id/photo – upload/replace passport photo (admin/HR) */
export const uploadPhoto = [
  upload.single('passport_photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');
      const photoPath = path.relative(process.cwd(), req.file.path);
      const employee = await employeeModel.update(id, { passport_photo_path: photoPath });
      logger.info('Passport photo updated', { employeeId: id });
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  },
];
