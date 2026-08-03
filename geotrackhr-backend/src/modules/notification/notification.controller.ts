import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { notificationModel } from './notification.model';

/** Create a notification – internal use (admin/HR) */
export async function createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      recipient_id: z.string().uuid(),
      notification_type: z.string(),
      title: z.string(),
      message: z.string(),
    });
    const payload = schema.parse(req.body);
    const notif = await notificationModel.create(payload);
    logger.info('Notification created', { notificationId: notif.id });
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
}

/** Get notifications for a user (self-or-role guarded) */
export async function getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const isManager = ['admin', 'hr', 'supervisor'].includes(req.user!.role);
    if (!isManager && userId !== req.user!.userId) {
      throw new AppError('Access denied — you can only view your own notifications', 403, 'FORBIDDEN');
    }
    const { unreadOnly } = req.query as any;
    const notifications = await notificationModel.findByUser(userId, { unreadOnly: unreadOnly === 'true' });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark a notification as read. Any authenticated user may mark their own
 * notifications as read; admin/hr/supervisor may act on any notification
 * (e.g. marking system-wide notices read on behalf of others).
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const notif = await notificationModel.findById(id);
    if (!notif) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');

    const isManager = ['admin', 'hr', 'supervisor'].includes(req.user!.role);
    if (!isManager && notif.recipient_id !== req.user!.userId) {
      throw new AppError('Access denied — you can only mark your own notifications as read', 403, 'FORBIDDEN');
    }

    const updated = await notificationModel.markAsRead(id);
    logger.info('Notification marked as read', { notificationId: id });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
