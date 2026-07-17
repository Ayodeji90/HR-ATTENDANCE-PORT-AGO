import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import { createNotification, getUserNotifications, markAsRead } from './notification.controller';

const router = Router();

router.use(authenticate);

// Admin/HR can create notifications
router.post('/', requireRole('admin', 'hr'), createNotification);

// Users can fetch their notifications
router.get('/user/:userId', getUserNotifications);

// Mark as read
router.post('/:id/read', requireRole('admin', 'hr'), markAsRead);

export default router;
