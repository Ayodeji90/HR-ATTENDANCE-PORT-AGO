import type { Knex } from 'knex';

/**
 * Migration 011: Site Employees (pivot)
 *
 * Many-to-many assignment of employees to construction sites.
 * site.model.ts's assignEmployees/removeEmployees have always assumed
 * this table exists; it was never created.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('site_employees', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    t.uuid('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.unique(['site_id', 'employee_id']);
  });

  await knex.schema.raw(`
    CREATE INDEX idx_site_employees_site ON site_employees(site_id);
    CREATE INDEX idx_site_employees_employee ON site_employees(employee_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('site_employees');
}
