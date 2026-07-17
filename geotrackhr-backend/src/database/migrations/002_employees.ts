import type { Knex } from 'knex';

/**
 * Migration 002: Employees
 *
 * Creates the employees table — the core entity representing workers
 * in the construction organization. Employees are distinct from users:
 * - users = system login accounts (HR, supervisors, admins)
 * - employees = workers whose attendance is tracked
 *
 * Design decisions:
 * - employee_code: unique human-readable identifier (e.g. "EMP-001")
 * - department: construction-specific departments
 * - designation: job title / role on site
 * - passport_photo_path: stores file path to uploaded photo, used for facial verification
 * - approval_status: supports self-registration workflow (pending → approved/rejected)
 * - is_active: soft delete / archival instead of hard delete
 * - Separate from users table because many employees won't have login accounts
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('employees', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('employee_code', 30).notNullable().unique();
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('email', 255).nullable().unique();
    t.string('phone', 30).nullable();
    t.string('department', 100).nullable();
    t.string('designation', 150).nullable();
    t.date('date_of_birth').nullable();
    t.date('hire_date').nullable();
    t.string('passport_photo_path', 500).nullable();
    t.string('approval_status', 20).defaultTo('pending').notNullable();
    // pending | approved | rejected
    t.text('rejection_reason').nullable();
    t.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Indexes for common queries
  await knex.schema.raw(`
    CREATE INDEX idx_employees_code ON employees(employee_code);
    CREATE INDEX idx_employees_department ON employees(department);
    CREATE INDEX idx_employees_approval ON employees(approval_status);
    CREATE INDEX idx_employees_active ON employees(is_active);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('employees');
}