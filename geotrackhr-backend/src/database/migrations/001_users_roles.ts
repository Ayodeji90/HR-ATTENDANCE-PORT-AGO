import type { Knex } from 'knex';

/**
 * Migration 001: Users & Roles
 *
 * Creates the foundational auth tables:
 * - roles: system role definitions (admin, hr, supervisor, employee)
 * - users: authentication accounts linked to roles
 * - refresh_tokens: JWT refresh token store for secure rotation
 *
 * Design decisions:
 * - UUID primary keys for security (non-sequential, unguessable)
 * - Argon2 password hashing (done in app layer, column stores the hash)
 * - refresh_tokens has FK cascade so deleting a user invalidates their sessions
 * - unique constraint on email for login lookup
 * - role_id FK ensures every user has a valid role
 */
export async function up(knex: Knex): Promise<void> {
  // --- ROLES ---
  await knex.schema.createTable('roles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 50).notNullable().unique(); // admin, hr, supervisor, employee
    t.string('description', 255).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // --- USERS ---
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('RESTRICT');
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.string('full_name', 150).notNullable();
    t.string('phone', 30).nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('last_login_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // --- REFRESH TOKENS ---
  await knex.schema.createTable('refresh_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 255).notNullable().unique();
    t.string('device_info', 255).nullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Index for fast token lookup
  await knex.schema.raw(`
    CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
}