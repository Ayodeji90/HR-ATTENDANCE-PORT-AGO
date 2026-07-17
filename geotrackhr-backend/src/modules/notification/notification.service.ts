import { notificationModel } from './notification.model';
import { logger } from '@utils/logger';

/** Create a notification for a user (recipient_id = users.id) */
export async function sendNotification(
  recipientId: string,
  notificationType: string,
  title: string,
  message: string,
  reference?: { type: string; id: string },
): Promise<void> {
  const notif = await notificationModel.create({
    recipient_id: recipientId,
    notification_type: notificationType,
    title,
    message,
    reference_type: reference?.type,
    reference_id: reference?.id,
  });
  logger.info('Notification sent', { notificationId: notif.id, recipientId, notificationType });
}

/** Attendance punch is awaiting HR/admin approval (late or after-10am check-in) */
export async function attendancePendingTrigger(recipientUserId: string, attendanceId: string): Promise<void> {
  await sendNotification(
    recipientUserId,
    'attendance_alert',
    'Attendance pending approval',
    `Your attendance record is pending approval.`,
    { type: 'attendance_record', id: attendanceId },
  );
}

export async function leaveApprovedTrigger(recipientUserId: string, leaveId: string): Promise<void> {
  await sendNotification(
    recipientUserId,
    'leave_approved',
    'Leave request approved',
    `Your leave request has been approved.`,
    { type: 'leave_request', id: leaveId },
  );
}

export async function leaveRejectedTrigger(recipientUserId: string, leaveId: string, reason?: string): Promise<void> {
  await sendNotification(
    recipientUserId,
    'leave_rejected',
    'Leave request rejected',
    reason ? `Your leave request was rejected: ${reason}` : 'Your leave request was rejected.',
    { type: 'leave_request', id: leaveId },
  );
}
