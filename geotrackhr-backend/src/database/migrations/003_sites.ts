import type { Knex } from 'knex';

/**
 * Migration 003: Sites (Construction Sites with Geofences)
 *
 * Each construction site has a GPS center point and a radius defining
 * the geofence boundary. Employees must be within this radius to
 * successfully check in/out.
 *
 * Design decisions:
 * - latitude/longitude stored as DECIMAL(10,7) for ~1cm precision
 * - radius_meters: geofence radius (typical range 50m–500m)
 * - is_active: sites can be archived when construction completes
 * - address fields: human-readable location for UI display
 * - created_by: FK to users, tracks who registered the site
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sites', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 200).notNullable();
    t.string('code', 30).notNullable().unique();
    t.text('description').nullable();
    t.string('address_line1', 255).nullable();
    t.string('address_line2', 255).nullable();
    t.string('city', 100).nullable();
    t.string('state', 100).nullable();
    t.string('country', 100).nullable();
    t.string('postal_code', 20).nullable();

    // Geofence center point
    t.decimal('latitude', 10, 7).notNullable();
    t.decimal('longitude', 10, 7).notNullable();
    t.integer('radius_meters').notNullable().defaultTo(100);

    t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    CREATE INDEX idx_sites_code ON sites(code);
    CREATE INDEX idx_sites_active ON sites(is_active);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sites');
}