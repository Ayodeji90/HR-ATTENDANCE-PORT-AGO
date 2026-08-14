import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { requireSelfOrRole } from '@middleware/ownership';
import {
  submitLeave,
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

// Pending leave queue + HR decision (single-stage: HR acts directly on the
// fresh request — no supervisor stage).
router.get('/pending', requireRole('admin', 'hr'), pendingLeaves);
router.post('/:id/hr-approve', requireRole('admin', 'hr'), hrApprove);
router.post('/:id/hr-reject', requireRole('admin', 'hr'), hrApprove);

export default router;
