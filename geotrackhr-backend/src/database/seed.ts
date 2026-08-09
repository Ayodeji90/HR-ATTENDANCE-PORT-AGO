/**
 * Programmatic seed runner, invoked via `tsx` (see package.json db:seed).
 * See migrate.ts for why this doesn't go through knex's own CLI.
 */
import fs from 'fs';
import knex from 'knex';
import { knexfile } from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

async function main(): Promise<void> {
  // --- Diagnostics: log exactly what knex will load and what is on disk. ---
  const cfg = knexfile[environment] ?? knexfile.development;
  const seedsCfg = cfg.seeds;
  console.log('[seed] NODE_ENV:', environment);
  console.log('[seed] seeds config:', JSON.stringify(seedsCfg ?? null));
  if (seedsCfg && typeof seedsCfg.directory === 'string') {
    try {
      console.log(
        '[seed] files in',
        seedsCfg.directory,
        '->',
        fs.readdirSync(seedsCfg.directory).sort().join(', '),
      );
    } catch (err) {
      console.log('[seed] could not list', seedsCfg.directory, ':', (err as Error).message);
    }
  }

  // --- Idempotency guard ------------------------------------------------
  // The seed truncates tables, so it must never run against an already-
  // populated database. Render runs this script on every deploy (see
  // render.yaml startCommand) — skip unless the users table is empty, or
  // the operator passes --force to explicitly wipe and re-seed.
  const force = process.argv.includes('--force');
  const row = await db('users').count({ total: '*' }).first();
  const userCount = Number(row?.total ?? 0);
  if (!force && userCount > 0) {
    console.log(`[seed] users table already has ${userCount} row(s) — skipping (use --force to wipe & re-seed).`);
    return;
  }
  if (force) {
    console.log('[seed] --force detected — truncating and re-seeding.');
  }

  const [log] = await db.seed.run();
  console.log('Seed files run:', log);
}

main()
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    return db.destroy().finally(() => process.exit(1));
  });
