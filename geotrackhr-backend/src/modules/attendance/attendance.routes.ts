import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { requireSelfOrRole } from '@middleware/ownership';
import {
  listAttendance,
  getAttendance,
  checkIn,
  afternoonConfirm,
  checkOut,
  syncAttendance,
  approveAttendance,
  rejectAttendance,
  employeeHistory,
} from './attendance.controller';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Self‑service endpoints (employee_id, if provided, is always overridden to
// the caller's own linked employee record for employee-role users — see
// @middleware/ownership resolveEmployeeId)
router.post('/checkin', checkIn);
router.post('/afternoon', afternoonConfirm);
router.post('/checkout', checkOut);
router.post('/sync', syncAttendance);
router.get('/employee/:employeeId/history', requireSelfOrRole('admin', 'hr', 'supervisor'), employeeHistory);

// Admin/HR protected endpoints
const adminOrHR = requireRole('admin', 'hr');
router.get('/', adminOrHR, listAttendance);
router.get('/:id', adminOrHR, getAttendance);
router.post('/:id/approve', adminOrHR, approveAttendance);
router.post('/:id/reject', adminOrHR, rejectAttendance);

export default router;
