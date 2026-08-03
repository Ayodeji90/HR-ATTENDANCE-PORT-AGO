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

// Mark as read – any authenticated user can mark their own notifications;
// ownership is enforced inside the controller.
router.post('/:id/read', markAsRead);

export default router;
