import { Knex } from 'knex';

/**
 * Migration 009: user_devices
 *
 * Stores device tokens for push notification targeting.
 * Each user can have multiple devices (phone, tablet, web).
 * Unique constraint on (user_id, device_token) prevents duplicates.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_devices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('device_token', 512).notNullable();
    t.enum('device_type', ['ios', 'android', 'web']).notNullable();
    t.string('device_name', 255).nullable();
    t.timestamp('last_used_at').defaultTo(knex.fn.now());
    t.timestamp('created_at').defaultTo(knex.fn.now());

    // Prevent duplicate device registrations
    t.unique(['user_id', 'device_token']);

    // Index for fast lookup by user
    t.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_devices');
}