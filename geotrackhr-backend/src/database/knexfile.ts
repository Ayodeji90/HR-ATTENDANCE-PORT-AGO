import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

// Load .env from the backend root (two levels up from src/database)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Build the pg connection config.
 *
 * When DATABASE_URL is set (Neon, Render Postgres, etc.) it wins and is used
 * directly as a connection string — this is the value you paste from Neon's
 * dashboard. Otherwise the individual DB_* variables are used (local dev).
 *
 * SSL: managed Postgres providers require TLS. Render's managed Postgres
 * presents a SELF-SIGNED cert on its internal connection, which Node refuses
 * by default (DEPTH_ZERO_SELF_SIGNED_CERT). Render deployments must set
 * DB_SSL_REJECT_UNAUTHORIZED=false to trust it. Providers with a proper CA
 * (e.g. Neon) keep the default (verify) and the URL's own sslmode applies.
 */
function connection(): Knex.PgConnectionConfig {
  if (process.env.DATABASE_URL) {
    // Opt-out of cert verification (Render's self-signed internal cert).
    // Strip any sslmode param from the URL so pg's own URL parsing can't
    // re-enable verification, then force ssl explicitly. (If sslmode is the
    // last query param a dangling '?' or '&' can remain — pg tolerates that.)
    if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
      const url = process.env.DATABASE_URL.replace(/sslmode=[^&#]*&?/g, '');
      return {
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      };
    }
    // Managed providers (Neon, Render) usually already carry ?sslmode=require
    // in the URL — honor that. Only add an explicit ssl config when the URL
    // doesn't declare sslmode but the provider still requires SSL.
    const hasSslMode = /(^|[?&])sslmode=/.test(process.env.DATABASE_URL);
    if (hasSslMode) {
      return { connectionString: process.env.DATABASE_URL };
    }
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'geotrackhr',
    user: process.env.DB_USER || 'geotrackhr_user',
    password: process.env.DB_PASSWORD || 'change_me_in_production',
  };
}

const config: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: connection(),
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
      extension: 'ts',
    },
  },

  production: {
    client: 'pg',
    connection: connection(),
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      // Compiled migrations/seeds are renamed to .cjs by scripts/to-cjs.js
      // (see the buildCommand in render.yaml) so Node's ESM syntax detection
      // can never misclassify them. Development keeps 'ts' (tsx runner).
      extension: 'cjs',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
      extension: 'cjs',
    },
  },
};

export const knexfile = config;
export default config;