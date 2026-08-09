import type { Knex } from 'knex';

/**
 * Migration 014: Attendance Selfie Capture
 *
 * Adds a selfie_path column to attendance_records so a live photo taken at
 * punch time can be stored alongside the GPS data. The image file itself
 * lives under config.upload.dir/attendance (ephemeral disk — wiped on
 * redeploy, same as facial templates/leave documents; fine for a demo).
 *
 * The existing 004_attendance columns (gps_accuracy, facial_match_score,
 * facial_verified, device_info, ip_address) were already in place but never
 * populated by the punch controller — that wiring happens in
 * attendance.controller.ts as part of this feature.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('attendance_records', (t) => {
    t.string('selfie_path', 500).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('attendance_records', (t) => {
    t.dropColumn('selfie_path');
  });
}
