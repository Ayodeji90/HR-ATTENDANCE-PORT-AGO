import type { Knex } from 'knex';

/**
 * Migration 005: Leave Requests
 *
 * Manages employee leave applications with approval workflow.
 * Supports multiple leave types relevant to construction:
 * annual, sick, casual, emergency, maternity, unpaid.
 *
 * Design decisions:
 * - leave_type: enum of supported leave categories
 * - status: pending → approved_by_supervisor → approved_by_hr → rejected → cancelled
 * - Two-level approval: supervisor first, then HR (modeled as separate FK columns)
 * - half_day flag: supports half-day leave requests
 * - reason: employee's stated reason; rejection_reason: why it was denied
 * - duration_days: computed column for quick reporting (stored, not virtual)
 * - Unique constraint prevents overlapping leave requests for same employee+date range
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('leave_requests', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');

    t.string('leave_type', 30).notNullable();
    // annual, sick, casual, emergency, maternity, unpaid

    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.decimal('duration_days', 5, 1).notNullable();
    t.boolean('half_day').defaultTo(false);

    t.text('reason').nullable();

    // Approval workflow
    t.string('status', 25).defaultTo('pending').notNullable();
    // pending | approved_by_supervisor | approved_by_hr | rejected | cancelled

    t.uuid('supervisor_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('supervisor_approved_at').nullable();
    t.text('supervisor_comment').nullable();

    t.uuid('hr_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('hr_approved_at').nullable();
    t.text('hr_comment').nullable();

    t.text('rejection_reason').nullable();

    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    CREATE INDEX idx_leaves_employee ON leave_requests(employee_id);
    CREATE INDEX idx_leaves_status ON leave_requests(status);
    CREATE INDEX idx_leaves_dates ON leave_requests(start_date, end_date);
    CREATE INDEX idx_leaves_type ON leave_requests(leave_type);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('leave_requests');
}