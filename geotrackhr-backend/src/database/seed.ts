/**
 * Programmatic seed runner, invoked via `tsx` (see package.json db:seed).
 * See migrate.ts for why this doesn't go through knex's own CLI.
 */
import knex from 'knex';
import { knexfile } from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

async function main(): Promise<void> {
  const [log] = await db.seed.run();
  console.log('Seed files run:', log);
}

main()
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    return db.destroy().finally(() => process.exit(1));
  });
