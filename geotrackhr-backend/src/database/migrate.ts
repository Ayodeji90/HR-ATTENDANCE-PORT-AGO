/**
 * Programmatic migration runner, invoked via `tsx` (see package.json
 * db:migrate / db:migrate:rollback). Knex's own CLI has no TypeScript
 * loader configured for this project, so the CLI can't run .ts migration
 * files directly — running through tsx sidesteps that entirely.
 */
import fs from 'fs';
import knex from 'knex';
import { knexfile } from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

async function main(): Promise<void> {
  // --- Diagnostics: log exactly what knex will load and what is on disk, so
  // a failed deploy shows the real state instead of a bare SyntaxError. ---
  const cfg = knexfile[environment] ?? knexfile.development;
  const mig = cfg.migrations;
  console.log('[migrate] NODE_ENV:', environment);
  console.log('[migrate] migrations config:', JSON.stringify(mig ?? null));
  if (mig && typeof mig.directory === 'string') {
    try {
      console.log(
        '[migrate] files in',
        mig.directory,
        '->',
        fs.readdirSync(mig.directory).sort().join(', '),
      );
    } catch (err) {
      console.log('[migrate] could not list', mig.directory, ':', (err as Error).message);
    }
  }

  const rollback = process.argv.includes('--rollback');
  if (rollback) {
    const [batch, log] = await db.migrate.rollback();
    console.log(`Rolled back batch ${batch}:`, log);
  } else {
    const [batch, log] = await db.migrate.latest();
    if (log.length === 0) {
      console.log('Already up to date.');
    } else {
      console.log(`Batch ${batch} migrations applied:`, log);
    }
  }
}

main()
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    return db.destroy().finally(() => process.exit(1));
  });
