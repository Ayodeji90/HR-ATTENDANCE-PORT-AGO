import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error(
    'JWT_SECRET and JWT_REFRESH_SECRET must be set in production — refusing to start with the insecure development defaults.',
  );
}

export const config = {
  app: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'geotrackhr',
    user: process.env.DB_USER || 'geotrackhr_user',
    password: process.env.DB_PASSWORD || 'change_me_in_production',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  argon2: {
    memoryCost: Number(process.env.ARGON2_MEMORY_COST) || 65536,
    timeCost: Number(process.env.ARGON2_TIME_COST) || 3,
    parallelism: Number(process.env.ARGON2_PARALLELISM) || 4,
  },
  facial: {
    matchThreshold: Number(process.env.FACIAL_MATCH_THRESHOLD) || 0.85,
  },
  leave: {
    // Annual entitlement in days per leave_type. 'unpaid' has no cap.
    entitlements: {
      annual: Number(process.env.LEAVE_ANNUAL_DAYS) || 21,
      sick: Number(process.env.LEAVE_SICK_DAYS) || 10,
      casual: Number(process.env.LEAVE_CASUAL_DAYS) || 7,
      emergency: Number(process.env.LEAVE_EMERGENCY_DAYS) || 5,
      maternity: Number(process.env.LEAVE_MATERNITY_DAYS) || 90,
    } as Record<string, number>,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  log: {
    level: process.env.LOG_LEVEL || 'debug',
  },
} as const;