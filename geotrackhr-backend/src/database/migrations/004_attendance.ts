import type { Knex } from 'knex';

/**
 * Migration 004: Attendance Records
 *
 * Core attendance tracking table. Each row represents a check-in or
 * check-out event by an employee at a specific site.
 *
 * Design decisions:
 * - event_type: 'check_in' | 'check_out' — two rows per workday per employee
 * - gps_latitude/gps_longitude: the employee's actual GPS coordinates at time of punch
 * - gps_accuracy: device-reported accuracy in meters (for audit trail)
 * - within_geofence: boolean computed at punch time — was employee inside the site radius?
 * - facial_match_score: 0.0–1.0 confidence from facial verification (nullable for GPS-only punches)
 * - facial_verified: boolean flag for quick filtering
 * - device_info: captures device model/OS for audit
 * - ip_address: network-level audit trail
 * - Unique constraint on (employee_id, event_date, event_type) prevents duplicate punches
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('attendance_records', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
    t.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('RESTRICT');

    t.date('event_date').notNullable();
    t.time('event_time').notNullable();
    t.string('event_type', 10).notNullable(); // 'check_in' | 'check_out'

    // GPS data at time of punch
    t.decimal('gps_latitude', 10, 7).nullable();
    t.decimal('gps_longitude', 10, 7).nullable();
    t.decimal('gps_accuracy', 6, 2).nullable(); // meters

    // Geofence validation
    t.boolean('within_geofence').defaultTo(false);

    // Facial verification
    t.decimal('facial_match_score', 4, 3).nullable(); // 0.000–1.000
    t.boolean('facial_verified').defaultTo(false);

    // Audit metadata
    t.string('device_info', 255).nullable();
    t.string('ip_address', 45).nullable(); // IPv6 max length

    t.text('notes').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Prevent duplicate punches (same employee, same date, same type)
  await knex.schema.raw(`
    CREATE UNIQUE INDEX idx_attendance_unique_punch
      ON attendance_records(employee_id, event_date, event_type);
    CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
    CREATE INDEX idx_attendance_site ON attendance_records(site_id);
    CREATE INDEX idx_attendance_date ON attendance_records(event_date);
    CREATE INDEX idx_attendance_geofence ON attendance_records(within_geofence);
    CREATE INDEX idx_attendance_facial ON attendance_records(facial_verified);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('attendance_records');
}