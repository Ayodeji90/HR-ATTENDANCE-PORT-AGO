import type { Knex } from 'knex';

/**
 * Migration 008: Audit Logs
 *
 * Immutable audit trail for all sensitive operations. Records who did
 * what, when, from which IP, and what the before/after state was.
 *
 * Design decisions:
 * - actor_id: the user who performed the action (nullable for system actions)
 * - action: verb describing the operation (create, update, delete, approve, reject, etc.)
 * - entity_type + entity_id: polymorphic reference to the affected record
 * - changes: JSONB diff of before/after values for update operations.
 *   Stored as { before: {...}, after: {...} } for full reconstruction.
 * - ip_address: network-level audit for security forensics
 * - user_agent: browser/device info
 * - NO UPDATE/DELETE allowed on this table — append-only by convention
 *   (enforced at application level, not DB trigger)
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL');

    t.string('action', 50).notNullable();
    // create | update | delete | approve | reject
    // login | logout | check_in | check_out
    // facial_verify_pass | facial_verify_fail
    // geofence_pass | geofence_fail

    t.string('entity_type', 50).notNullable();
    // user | employee | site | attendance_record
    // leave_request | facial_template | notification

    t.uuid('entity_id').nullable();

    t.jsonb('changes').nullable();
    // { before: {...}, after: {...} }

    t.string('ip_address', 45).nullable();
    t.text('user_agent').nullable();
    t.text('notes').nullable();

    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
    CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX idx_audit_action ON audit_logs(action);
    CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
}