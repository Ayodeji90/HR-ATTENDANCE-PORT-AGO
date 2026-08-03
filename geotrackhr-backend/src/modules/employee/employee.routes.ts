import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import {
  listEmployees,
  getMe,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  selfRegister,
  approveEmployee,
  rejectEmployee,
  uploadPhoto,
} from './employee.controller';

const router = Router();

// Public self‑registration endpoint (no auth)
router.post('/register', selfRegister);

// All other routes require authentication
router.use(authenticate);

// List & get – any authenticated user. /me must be registered before /:id
// so the literal "me" path is not captured as an employee id.
router.get('/', listEmployees);
router.get('/me', getMe);
router.get('/:id', getEmployee);

// Admin / HR protected routes
const adminOrHR = requireRole('admin', 'hr');
router.post('/', adminOrHR, createEmployee);
router.put('/:id', adminOrHR, updateEmployee);
router.delete('/:id', adminOrHR, deactivateEmployee);
router.post('/:id/approve', adminOrHR, approveEmployee);
router.post('/:id/reject', adminOrHR, rejectEmployee);
router.post('/:id/photo', adminOrHR, uploadPhoto);

export default router;
