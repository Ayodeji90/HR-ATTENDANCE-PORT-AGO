import type { Knex } from 'knex';

/**
 * Migration 013: Leave Supporting Documents
 *
 * M8.9 requires employees to attach a supporting document to a leave
 * request (e.g. a medical certificate for sick leave). The original
 * leave_requests migration had no column to store it.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('leave_requests', (t) => {
    t.string('document_path', 500).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('leave_requests', (t) => {
    t.dropColumn('document_path');
  });
}
