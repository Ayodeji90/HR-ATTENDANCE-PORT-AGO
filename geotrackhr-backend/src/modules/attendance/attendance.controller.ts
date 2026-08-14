import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { attendanceModel, AttendanceRecord } from './attendance.model';
import { siteModel } from '@modules/site/site.model';
import { employeeModel } from '@modules/employee/employee.model';
import { isWithinGeofence } from '@utils/geofence';
import { facialModel } from '@modules/facial/facial.model';
import { config } from '@config/index';
import { resolveEmployeeId } from '@middleware/ownership';
import { getLocalTime, getLocalDate, isCheckInOnTime, isCheckInLate, isCheckInVeryLate, isAfternoonWindow, isCheckoutWindow } from '@utils/time';
import * as notificationService from '@modules/notification/notification.service';

/** Postgres unique_violation error code */
const UNIQUE_VIOLATION = '23505';

// ---------------------------------------------------------------------------
// Live-attendance selfie capture
// ---------------------------------------------------------------------------
const selfieDir = path.resolve(config.upload.dir, 'attendance');
if (!fs.existsSync(selfieDir)) {
  fs.mkdirSync(selfieDir, { recursive: true });
}

/**
 * Decodes a base64 data-URL selfie (e.g. from the web frontend's camera
 * capture) and writes it to uploads/attendance. Returns the stored relative
 * path. Throws if the payload isn't a valid JPEG/PNG data URL or is empty.
 */
function saveSelfie(dataUrl: string): string {
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) throw new AppError('Invalid selfie image format', 400, 'INVALID_SELFIE');
  const [, ext, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) throw new AppError('Selfie image is empty', 400, 'INVALID_SELFIE');
  if (buffer.length > config.upload.maxFileSize) {
    throw new AppError('Selfie image exceeds the size limit', 400, 'SELFIE_TOO_LARGE');
  }
  const filename = `att-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const absolute = path.join(selfieDir, filename);
  fs.writeFileSync(absolute, buffer);
  return path.relative(process.cwd(), absolute);
}

// Validation schemas. employee_id is accepted but ignored for employee-role
// callers — resolveEmployeeId always forces those to their own linked
// employee record (see @middleware/ownership).
// Shared live-attendance fields: optional base64 data-URL selfie captured at
// punch time, device-reported GPS accuracy in meters, and a device label.
const liveAttendanceFields = {
  selfie: z.string().optional(),
  gps_accuracy: z.number().min(0).max(100000).optional(),
  device_info: z.string().max(255).optional(),
};

const checkInSchema = z.object({
  employee_id: z.string().uuid().optional(),
  site_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  reason: z.string().optional(), // required for late (9:01-10:00) check-ins
  ...liveAttendanceFields,
});

const afternoonSchema = z.object({
  employee_id: z.string().uuid().optional(),
  site_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  ...liveAttendanceFields,
});

const checkoutSchema = z.object({
  employee_id: z.string().uuid().optional(),
  site_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  ...liveAttendanceFields,
});

const syncItemSchema = z.object({
  event_type: z.enum(['check_in', 'check_out', 'afternoon_confirm']),
  site_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  reason: z.string().optional(),
  client_timestamp: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid client_timestamp' }),
});

const syncSchema = z.object({
  items: z.array(syncItemSchema).min(1).max(50),
});

/** List attendance records (admin/HR) */
export async function listAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, employeeId, siteId, date, status } = req.query as any;
    const result = await attendanceModel.list({
      page: Number(page),
      limit: Number(limit),
      employeeId,
      siteId,
      date,
      status,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Get a single attendance record */
export async function getAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const record = await attendanceModel.findById(id);
    if (!record) throw new AppError('Attendance record not found', 404, 'ATTENDANCE_NOT_FOUND');
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify geofence for a site. Returns whether the point is inside the radius.
 * Throws GEOFENCE_VIOLATION when outside — unless demo mode is enabled, in
 * which case the distance is still measured/reported but never blocks a punch
 * (so the flow can be tested from anywhere).
 */
async function verifyGeofence(siteId: string, lat: number, lon: number): Promise<boolean> {
  const site = await siteModel.findById(siteId);
  if (!site) throw new AppError('Site not found for geofence check', 404, 'SITE_NOT_FOUND');
  const within = isWithinGeofence(lat, lon, site.latitude, site.longitude, site.radius_meters);
  if (!within && !config.attendance.demoMode) {
    throw new AppError('Location outside allowed geofence radius', 400, 'GEOFENCE_VIOLATION');
  }
  return within;
}

/**
 * Records a single punch (check_in / afternoon_confirm / check_out),
 * applying the shared geofence + time-window + status rules. `at` is the
 * moment the punch actually happened — `new Date()` for live punches, or
 * the client-supplied timestamp for offline-queued syncs.
 */
async function recordPunch(params: {
  employeeId: string;
  siteId: string;
  eventType: 'check_in' | 'afternoon_confirm' | 'check_out';
  latitude: number;
  longitude: number;
  reason?: string;
  at: Date;
  selfie?: string;
  gpsAccuracy?: number;
  deviceInfo?: string;
  ipAddress?: string;
}): Promise<AttendanceRecord> {
  const { employeeId, siteId, eventType, latitude, longitude, at } = params;
  let reason = params.reason;

  const employee = await employeeModel.findById(employeeId);
  if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

  const withinGeofence = await verifyGeofence(siteId, latitude, longitude);

  // Live selfie: persist the image and (placeholder) facial verification.
  // The real verification pipeline is not wired up yet — a stored template
  // means we record facial_verified=true; otherwise the image is still kept
  // as evidence and the record is flagged unverified.
  let selfiePath: string | null = null;
  let facialVerified = false;
  let facialMatchScore: number | null = null;
  if (params.selfie) {
    selfiePath = saveSelfie(params.selfie);
    const facial = await facialModel.findByEmployeeId(employeeId);
    if (facial) {
      facialVerified = true;
      facialMatchScore = 1; // placeholder — template exists
      logger.info('Facial verification passed (placeholder)', { employeeId });
    } else {
      logger.info('No facial template on file — selfie stored, verification skipped', { employeeId });
    }
  }

  const localTime = getLocalTime(at);
  let status: 'pending' | 'approved' = 'approved';

  if (config.attendance.demoMode) {
    // Demo mode: attendance policy (time windows + late-flagging) is skipped —
    // every punch records as an approved on-time punch so the flow can be
    // exercised end-to-end at any hour.
    logger.info('Demo mode active — attendance policy checks skipped', { employeeId, eventType });
    status = 'approved';
  } else if (eventType === 'check_in') {
    if (isCheckInOnTime(localTime)) {
      status = 'approved';
    } else if (isCheckInLate(localTime)) {
      if (!reason) throw new AppError('A reason is required for a late check-in (9:01-10:00)', 400, 'LATE_REASON_REQUIRED');
      status = 'pending';
    } else if (isCheckInVeryLate(localTime)) {
      status = 'pending';
      reason = reason ?? 'Check-in after 10:00 AM cutoff — requires HR approval';
    } else {
      throw new AppError('Check-in is only allowed from 00:00 up to 10:00', 400, 'OUTSIDE_CHECKIN_WINDOW');
    }
  } else if (eventType === 'afternoon_confirm') {
    if (!isAfternoonWindow(localTime)) {
      throw new AppError('Afternoon site confirmation is only allowed between 14:00 and 15:00', 400, 'OUTSIDE_AFTERNOON_WINDOW');
    }
  } else if (eventType === 'check_out') {
    if (!isCheckoutWindow(localTime)) {
      throw new AppError('Check-out is only allowed between 17:00 and 22:00', 400, 'OUTSIDE_CHECKOUT_WINDOW');
    }
  }

  try {
    const record = await attendanceModel.create({
      employee_id: employeeId,
      site_id: siteId,
      event_type: eventType,
      gps_latitude: latitude,
      gps_longitude: longitude,
      gps_accuracy: params.gpsAccuracy ?? null,
      within_geofence: withinGeofence, // true in strict mode (would have thrown otherwise); measured in demo mode
      status,
      reason,
      facial_match_score: facialMatchScore,
      facial_verified: facialVerified,
      selfie_path: selfiePath,
      device_info: params.deviceInfo ?? null,
      ip_address: params.ipAddress ?? null,
      event_date: getLocalDate(at),
      event_time: localTime.hour.toString().padStart(2, '0') + ':' + localTime.minute.toString().padStart(2, '0') + ':00',
    });

    if (status === 'pending' && employee.user_id) {
      await notificationService.attendancePendingTrigger(employee.user_id, record.id);
    }

    return record;
  } catch (err: any) {
    if (err?.code === UNIQUE_VIOLATION) {
      throw new AppError(`Already recorded a ${eventType} for this date`, 409, 'DUPLICATE_PUNCH');
    }
    throw err;
  }
}

/** Client IP (handles IPv4-mapped IPv6 from proxies/load balancers) */
function clientIp(req: Request): string {
  const raw = req.ip || req.socket.remoteAddress || '';
  return raw.replace(/^::ffff:/, '').slice(0, 45);
}

/** Morning check‑in */
export async function checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = checkInSchema.parse(req.body);
    const employeeId = await resolveEmployeeId(req, payload.employee_id);
    const record = await recordPunch({
      employeeId,
      siteId: payload.site_id,
      eventType: 'check_in',
      latitude: payload.latitude,
      longitude: payload.longitude,
      reason: payload.reason,
      at: new Date(),
      selfie: payload.selfie,
      gpsAccuracy: payload.gps_accuracy,
      deviceInfo: payload.device_info,
      ipAddress: clientIp(req),
    });
    logger.info('Check‑in recorded', { attendanceId: record.id, status: record.status });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** Afternoon site confirmation (2:00‑3:00 PM) */
export async function afternoonConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = afternoonSchema.parse(req.body);
    const employeeId = await resolveEmployeeId(req, payload.employee_id);
    const record = await recordPunch({
      employeeId,
      siteId: payload.site_id,
      eventType: 'afternoon_confirm',
      latitude: payload.latitude,
      longitude: payload.longitude,
      at: new Date(),
      selfie: payload.selfie,
      gpsAccuracy: payload.gps_accuracy,
      deviceInfo: payload.device_info,
      ipAddress: clientIp(req),
    });
    logger.info('Afternoon confirmation recorded', { attendanceId: record.id });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** Evening check‑out (5:00‑10:00 PM) */
export async function checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = checkoutSchema.parse(req.body);
    const employeeId = await resolveEmployeeId(req, payload.employee_id);
    const record = await recordPunch({
      employeeId,
      siteId: payload.site_id,
      eventType: 'check_out',
      latitude: payload.latitude,
      longitude: payload.longitude,
      at: new Date(),
      selfie: payload.selfie,
      gpsAccuracy: payload.gps_accuracy,
      deviceInfo: payload.device_info,
      ipAddress: clientIp(req),
    });
    logger.info('Check‑out recorded', { attendanceId: record.id });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * Offline sync: the mobile app queues punches captured while offline and
 * uploads them in a batch once connectivity returns. Each item is replayed
 * through the same rules as the live endpoints, keyed off its own
 * client_timestamp rather than "now". Partial failure is expected —
 * results are reported per item rather than failing the whole batch.
 */
export async function syncAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items } = syncSchema.parse(req.body);
    const employeeId = await resolveEmployeeId(req, (req.body as any).employee_id);

    const results = await Promise.all(
      items.map(async (item, index) => {
        try {
          const record = await recordPunch({
            employeeId,
            siteId: item.site_id,
            eventType: item.event_type,
            latitude: item.latitude,
            longitude: item.longitude,
            reason: item.reason,
            at: new Date(item.client_timestamp),
          });
          return { index, success: true, data: record };
        } catch (err) {
          const message = err instanceof AppError ? err.message : 'Unexpected error';
          const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
          return { index, success: false, error: { code, message } };
        }
      }),
    );

    logger.info('Attendance sync batch processed', { employeeId, count: items.length });
    res.status(207).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

/** Approve pending attendance (admin/HR) */
export async function approveAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const record = await attendanceModel.updateStatus(id, 'approved');
    logger.info('Attendance approved', { attendanceId: id });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** Reject pending attendance (admin/HR) */
export async function rejectAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
    const record = await attendanceModel.updateStatus(id, 'rejected', reason);
    logger.info('Attendance rejected', { attendanceId: id, reason });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

/** Get attendance history for a specific employee */
export async function employeeHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId } = req.params;
    const result = await attendanceModel.list({ employeeId });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
