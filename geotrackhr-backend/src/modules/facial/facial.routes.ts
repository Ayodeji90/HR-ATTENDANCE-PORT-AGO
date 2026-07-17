import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { registerFacial, verifyFacial } from './facial.controller';

const router = Router();

// All facial routes require authentication
router.use(authenticate);

// Register facial images – HR/admin only (employeeId in path)
router.post('/register/:employeeId', requireRole('admin', 'hr'), registerFacial);

// Verify selfie – employee self‑service
router.post('/verify/:employeeId', verifyFacial);

export default router;
