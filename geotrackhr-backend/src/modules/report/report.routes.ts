import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { requireSelfOrRole } from '@middleware/ownership';
import {
  dailyAttendanceSummary,
  siteAttendanceReport,
  employeeAttendanceHistory,
  monthlyAttendanceSummary,
  leaveBalanceReport,
} from './report.controller';

const router = Router();

router.use(authenticate);

// Daily summary – any authenticated user
router.get('/daily', dailyAttendanceSummary);

// Site report – admin/HR only
router.get('/site', requireRole('admin', 'hr'), siteAttendanceReport);

// Employee attendance history – admin/HR/supervisor, or the employee themself
router.get('/employee/:employeeId/history', requireSelfOrRole('admin', 'hr', 'supervisor'), employeeAttendanceHistory);

// Monthly summary – admin/HR
router.get('/monthly', requireRole('admin', 'hr'), monthlyAttendanceSummary);

// Leave balance – employee can view own, admin/HR/supervisor can view any
router.get('/leave-balance', requireSelfOrRole('admin', 'hr', 'supervisor'), leaveBalanceReport);

export default router;
