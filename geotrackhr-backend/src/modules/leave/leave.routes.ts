import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { requireSelfOrRole } from '@middleware/ownership';
import {
  submitLeave,
  supervisorApprove,
  hrApprove,
  uploadDocument,
  employeeLeaveHistory,
  pendingLeaves,
} from './leave.controller';

const router = Router();

// All leave routes require authentication
router.use(authenticate);

// Employee self‑service: submit leave request, view own history, attach a document
router.post('/', submitLeave);
router.get('/employee/:employeeId/history', requireSelfOrRole('admin', 'hr', 'supervisor'), employeeLeaveHistory);
router.post('/:id/document', uploadDocument);

// Supervisor stage (first approval)
router.get('/pending', requireRole('admin', 'hr', 'supervisor'), pendingLeaves);
router.post('/:id/approve', requireRole('admin', 'supervisor'), supervisorApprove);
router.post('/:id/reject', requireRole('admin', 'supervisor'), supervisorApprove);

// HR stage (final approval, only after supervisor has approved)
router.post('/:id/hr-approve', requireRole('admin', 'hr'), hrApprove);
router.post('/:id/hr-reject', requireRole('admin', 'hr'), hrApprove);

export default router;
