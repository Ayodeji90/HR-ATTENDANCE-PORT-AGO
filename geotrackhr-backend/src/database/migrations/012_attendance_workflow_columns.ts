import type { Knex } from 'knex';

/**
 * Migration 012: Attendance Workflow Columns
 *
 * The original attendance_records migration had no way to represent the
 * pending/approved/rejected approval workflow required by M6.5/M6.8 —
 * there was no status column at all. It also sized event_type as
 * varchar(10), too small for 'afternoon_confirm' (16 chars).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('attendance_records', (t) => {
    t.string('status', 20).notNullable().defaultTo('approved');
    // pending | approved | rejected
    t.text('reason').nullable();
    // late justification, or HR rejection reason
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    ALTER TABLE attendance_records ALTER COLUMN event_type TYPE varchar(20);
    CREATE INDEX idx_attendance_status ON attendance_records(status);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('attendance_records', (t) => {
    t.dropColumn('status');
    t.dropColumn('reason');
    t.dropColumn('updated_at');
  });
  await knex.schema.raw(`
    ALTER TABLE attendance_records ALTER COLUMN event_type TYPE varchar(10);
  `);
}
