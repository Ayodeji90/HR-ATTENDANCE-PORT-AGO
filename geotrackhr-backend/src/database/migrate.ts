/**
 * Programmatic migration runner, invoked via `tsx` (see package.json
 * db:migrate / db:migrate:rollback). Knex's own CLI has no TypeScript
 * loader configured for this project, so the CLI can't run .ts migration
 * files directly — running through tsx sidesteps that entirely.
 */
import knex from 'knex';
import { knexfile } from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

async function main(): Promise<void> {
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
