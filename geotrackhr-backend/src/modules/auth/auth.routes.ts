import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authConfig } from '@config/auth';
import { authenticate } from '@middleware/auth';
import { requireRole } from '@middleware/rbac';
import * as authController from '@modules/auth/auth.controller';

const router = Router();

/**
 * Auth Routes
 *
 * POST /api/auth/login     — Login with email + password (rate limited)
 * POST /api/auth/register  — Register new user (admin/HR only)
 * POST /api/auth/refresh   — Refresh expired access token
 * POST /api/auth/logout    — Invalidate refresh token
 * POST /api/auth/devices   — Register device for push notifications
 */

// ── Login rate limiter (stricter than general API limit) ──
const loginLimiter = rateLimit({
  windowMs: authConfig.loginRateLimit.windowMs,
  max: authConfig.loginRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMIT',
      message: 'Too many login attempts — please try again in 1 minute',
    },
  },
});

// ── Public routes (no auth required) ──────────────────

/** Login — rate limited to 5 attempts/min */
router.post('/login', loginLimiter, authController.login);

/** Refresh access token using refresh token */
router.post('/refresh', authController.refresh);

// ── Protected routes (auth required) ──────────────────

/** Register new user — admin/HR only */
router.post(
  '/register',
  authenticate,
  requireRole('admin', 'hr'),
  authController.register
);

/** Logout — invalidate refresh token */
router.post('/logout', authenticate, authController.logout);

/** Register device for push notifications */
router.post('/devices', authenticate, authController.registerDevice);

export default router;