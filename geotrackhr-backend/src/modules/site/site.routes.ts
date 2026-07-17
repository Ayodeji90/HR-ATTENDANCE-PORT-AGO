import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import {
  listSites,
  getSite,
  createSite,
  updateSite,
  deactivateSite,
  assignEmployees,
  removeEmployees,
} from './site.controller';

const router = Router();

// All site routes require authentication
router.use(authenticate);

// Public read‑only endpoints (any authenticated user)
router.get('/', listSites);
router.get('/:id', getSite);

// Admin / HR protected endpoints
const adminOrHR = requireRole('admin', 'hr');
router.post('/', adminOrHR, createSite);
router.put('/:id', adminOrHR, updateSite);
router.delete('/:id', adminOrHR, deactivateSite);
router.post('/:id/assign', adminOrHR, assignEmployees);
router.post('/:id/remove', adminOrHR, removeEmployees);

export default router;
