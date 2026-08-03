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
 * SSL is enabled for DATABASE_URL connections since managed Postgres
 * providers require it; set DB_SSL_REJECT_UNAUTHORIZED=false if your
 * provider uses a self-signed cert.
 */
function connection(): Knex.PgConnectionConfig {
  if (process.env.DATABASE_URL) {
    // Managed providers (Neon, Render) usually already carry ?sslmode=require
    // in the URL — honor that. Only add an explicit ssl config when the URL
    // doesn't declare sslmode but the provider still requires SSL.
    const hasSslMode = /(^|[?&])sslmode=/.test(process.env.DATABASE_URL);
    if (hasSslMode) {
      return { connectionString: process.env.DATABASE_URL };
    }
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' },
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
      extension: 'js',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
      extension: 'js',
    },
  },
};

export const knexfile = config;
export default config;