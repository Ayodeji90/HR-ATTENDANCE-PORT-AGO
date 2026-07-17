import type { Knex } from 'knex';

/**
 * Migration 010: Link Employees to Users
 *
 * The employees table (worker records tracked for attendance) and the
 * users table (login accounts) were originally created as fully separate
 * entities. That's correct for employees with no login access, but there
 * is no way to resolve which employee record a logged-in user (role
 * 'employee') corresponds to — required for every self-service ownership
 * check (attendance/leave history, leave balance, check-in).
 *
 * user_id is nullable (most employees may never get a login account) and
 * unique (a user account maps to at most one employee record).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('employees', (t) => {
    t.uuid('user_id').nullable().unique().references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.raw(`
    CREATE INDEX idx_employees_user ON employees(user_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('employees', (t) => {
    t.dropColumn('user_id');
  });
}
