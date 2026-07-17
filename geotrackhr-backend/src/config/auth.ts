import { config } from './index';

/**
 * Auth-specific configuration.
 *
 * Extracted from the main config for clarity — all auth-related
 * settings in one place. Values sourced from environment variables
 * with secure defaults for development.
 *
 * JWT:
 * - accessTokenExpiry: short-lived (15 min) — limits damage if stolen
 * - refreshTokenExpiry: longer (7 days) — allows week-long sessions
 *   without re-login, but rotated on each use
 *
 * Argon2:
 * - OWASP-recommended parameters for password hashing
 * - memoryCost: 65536 KiB (64 MB) — makes GPU attacks expensive
 * - timeCost: 3 iterations — balances security and login latency
 * - parallelism: 4 threads — uses modern multi-core CPUs
 *
 * Login rate limiting:
 * - Stricter than general API rate limit (5 attempts/min vs 100/15min)
 * - Prevents credential brute-forcing
 */
export const authConfig = {
  jwt: {
    accessTokenExpiry: process.env.JWT_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    secret: config.jwt.secret,
    refreshSecret: config.jwt.refreshSecret,
  },
  argon2: {
    memoryCost: config.argon2.memoryCost,
    timeCost: config.argon2.timeCost,
    parallelism: config.argon2.parallelism,
  },
  loginRateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute
  },
} as const;