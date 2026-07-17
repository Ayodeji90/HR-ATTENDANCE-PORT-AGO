import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { siteModel } from './site.model';

// Validation schemas
const siteCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive(),
});

const siteUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  is_active: z.boolean().optional(),
});

/** List sites (paginated, optional search) */
export async function listSites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search } = req.query as any;
    const result = await siteModel.list({
      page: Number(page),
      limit: Number(limit),
      search,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Get site by ID */
export async function getSite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const site = await siteModel.findById(id);
    if (!site) throw new AppError('Site not found', 404, 'SITE_NOT_FOUND');
    res.json({ success: true, data: site });
  } catch (err) {
    next(err);
  }
}

/** Create a new site (admin/HR) */
export async function createSite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = siteCreateSchema.parse(req.body);
    const site = await siteModel.create(payload);
    logger.info('Site created', { siteId: site.id });
    res.status(201).json({ success: true, data: site });
  } catch (err) {
    next(err);
  }
}

/** Update an existing site */
export async function updateSite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const payload = siteUpdateSchema.parse(req.body);
    const site = await siteModel.update(id, payload);
    logger.info('Site updated', { siteId: id });
    res.json({ success: true, data: site });
  } catch (err) {
    next(err);
  }
}

/** Deactivate (soft‑delete) a site */
export async function deactivateSite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await siteModel.deactivate(id);
    logger.info('Site deactivated', { siteId: id });
    res.json({ success: true, data: { message: 'Site deactivated' } });
  } catch (err) {
    next(err);
  }
}

/** Assign employees to a site */
export async function assignEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params; // site id
    const { employeeIds } = z.object({ employeeIds: z.array(z.string()) }).parse(req.body);
    await siteModel.assignEmployees(id, employeeIds);
    logger.info('Employees assigned to site', { siteId: id, employeeIds });
    res.json({ success: true, data: { message: 'Employees assigned' } });
  } catch (err) {
    next(err);
  }
}

/** Remove employees from a site */
export async function removeEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params; // site id
    const { employeeIds } = z.object({ employeeIds: z.array(z.string()) }).parse(req.body);
    await siteModel.removeEmployees(id, employeeIds);
    logger.info('Employees removed from site', { siteId: id, employeeIds });
    res.json({ success: true, data: { message: 'Employees removed' } });
  } catch (err) {
    next(err);
  }
}
