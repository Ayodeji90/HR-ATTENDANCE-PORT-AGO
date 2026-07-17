import type { Knex } from 'knex';

/**
 * Migration 006: Notifications
 *
 * In-app notification system for leave approvals, attendance alerts,
 * and system announcements. Supports both user-targeted and broadcast
 * notifications.
 *
 * Design decisions:
 * - recipient_id: FK to users (nullable for broadcast/system notifications)
 * - notification_type: categorizes for UI filtering and routing
 * - is_read: tracks read status for unread badge counts
 * - reference_id + reference_type: polymorphic link to the related entity
 *   (e.g. leave_request, attendance_record) for "View Details" navigation
 * - expires_at: auto-cleanup of old notifications
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('recipient_id').nullable().references('id').inTable('users').onDelete('CASCADE');

    t.string('notification_type', 40).notNullable();
    // leave_requested | leave_approved | leave_rejected
    // attendance_alert | check_in_reminder | check_out_reminder
    // employee_registered | employee_approved | employee_rejected
    // system_announcement | geofence_violation

    t.string('title', 200).notNullable();
    t.text('message').notNullable();

    // Polymorphic reference to source entity
    t.string('reference_type', 40).nullable();
    // leave_request | attendance_record | employee | site
    t.uuid('reference_id').nullable();

    t.boolean('is_read').defaultTo(false);
    t.timestamp('read_at').nullable();
    t.timestamp('expires_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
    CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read)
      WHERE is_read = false;
    CREATE INDEX idx_notifications_type ON notifications(notification_type);
    CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}