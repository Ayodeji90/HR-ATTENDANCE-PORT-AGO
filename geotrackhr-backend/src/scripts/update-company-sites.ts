/**
 * Update the company sites (geofences) in-place.
 *
 * WHY: the live attendance flow verifies the employee's GPS against the
 * site's latitude/longitude + radius_meters. The seed (001_bootstrap) now
 * contains the real company locations, but the seed is idempotent — it
 * skips when the database already has users, so an existing production
 * database still holds the old demo coordinates. This script updates the
 * existing rows by site code so employee assignments (site_employees) are
 * preserved and nothing is truncated.
 *
 * Run against any environment (local or production):
 *   npm run db:update-sites
 * or, on Render, in the service shell:
 *   npx tsx src/scripts/update-company-sites.ts
 *
 * Idempotent — safe to run repeatedly.
 */
import knex from 'knex';
import { knexfile } from '../database/knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

/** The two real company locations (from Google Maps, geocoded via the
 *  Google Geocoding API) that employee GPS is verified against. */
const companySites = [
  {
    code: 'SITE-DT1',
    name: 'Kamio Homes (Victoria Island)',
    description: 'Company office — 2A Louis Solomon Cl, Victoria Island, Lagos',
    address_line1: '2A Louis Solomon Cl',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'NG',
    postal_code: '71510',
    latitude: 6.427667,
    longitude: 3.408044,
    radius_meters: 100,
  },
  {
    code: 'SITE-HW2',
    name: 'Molade Okoya Thomas St (Ogba)',
    description: 'Company office — 9 Molade Okoya Thomas St, Ogba, Ikeja, Lagos',
    address_line1: '9 Molade Okoya Thomas St',
    city: 'Ogba',
    state: 'Lagos',
    country: 'NG',
    postal_code: '101233',
    latitude: 6.619298,
    longitude: 3.3462232,
    radius_meters: 100,
  },
  {
    code: 'SITE-AD3',
    name: '11 Adeyemi St (Ijaiye)',
    description: 'Company office — 11 Adeyemi St, Ijaiye, Lagos',
    address_line1: '11 Adeyemi St',
    city: 'Ijaiye',
    state: 'Lagos',
    country: 'NG',
    postal_code: '102212',
    // Google Maps pin for this address is misplaced (~1.4 km off); the
    // coordinates below are the office's actual GPS measured on-site.
    latitude: 6.4474,
    longitude: 3.3903,
    radius_meters: 100,
  },
];

async function main(): Promise<void> {
  console.log(`[update-sites] NODE_ENV: ${environment}`);
  let updated = 0;
  let created = 0;

  for (const site of companySites) {
    const existing = await db('sites').where({ code: site.code }).first();
    if (existing) {
      await db('sites')
        .where({ code: site.code })
        .update({
          name: site.name,
          description: site.description,
          address_line1: site.address_line1,
          city: site.city,
          state: site.state,
          country: site.country,
          postal_code: site.postal_code,
          latitude: site.latitude,
          longitude: site.longitude,
          radius_meters: site.radius_meters,
          is_active: true,
          updated_at: db.fn.now(),
        });
      updated++;
      console.log(
        `[update-sites] updated ${site.code} (${site.name}) -> ${site.latitude}, ${site.longitude} (radius ${site.radius_meters}m)`,
      );
    } else {
      await db('sites').insert({ ...site, is_active: true });
      created++;
      console.log(
        `[update-sites] created ${site.code} (${site.name}) -> ${site.latitude}, ${site.longitude} (radius ${site.radius_meters}m)`,
      );
    }
  }

  console.log(`[update-sites] done — ${updated} updated, ${created} created.`);
}

main()
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    return db.destroy().finally(() => process.exit(1));
  });
