import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '@config/index';
import { errorHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import authRoutes from '@modules/auth/auth.routes';
import siteRoutes from '@modules/site/site.routes';
import employeeRoutes from '@modules/employee/employee.routes';
import attendanceRoutes from '@modules/attendance/attendance.routes';
import facialRoutes from '@modules/facial/facial.routes';
import leaveRoutes from '@modules/leave/leave.routes';
import notificationRoutes from '@modules/notification/notification.routes';
import reportRoutes from '@modules/report/report.routes';

/**
 * Express application factory.
 *
 * Middleware chain order (important — each layer passes to next via next()):
 * 1. Helmet — security headers (CSP, XSS protection, etc.)
 * 2. CORS — cross-origin requests from frontend/mobile
 * 3. Compression — gzip/brotli response compression
 * 4. Morgan — HTTP request logging (combined format in prod, dev in dev)
 * 5. express.json() — parse JSON request bodies
 * 6. express.urlencoded() — parse form-encoded bodies
 * 7. Rate limiter — brute-force / DDoS protection
 * 8. Routes — mounted by feature modules (auth, employees, sites, etc.)
 * 9. 404 handler — catch unmatched routes
 * 10. Error handler — centralized error response formatting
 */
const app = express();

// ── Security headers ───────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
  })
);

// ── Compression ────────────────────────────────────────
app.use(compression());

// ── HTTP request logging ───────────────────────────────
const morganFormat =
  config.app.nodeEnv === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

// ── Body parsing ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
  })
);

// ── Health check (no auth required) ────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.nodeEnv,
    },
  });
});

// ── API routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
// Mount built route modules
app.use('/api/sites', siteRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/facial', facialRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/report', reportRoutes);

// ── 404 handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// ── Global error handler (must be last) ────────────────
app.use(errorHandler);

export default app;