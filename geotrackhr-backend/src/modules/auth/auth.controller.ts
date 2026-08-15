import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { authConfig } from '@config/auth';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { hashPassword, verifyPassword } from '@utils/password';
import * as userModel from '@modules/auth/user.model';
import knex from 'knex';
import { knexfile } from '@database/knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] || knexfile.development);

// ── Validation Schemas ────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  deviceInfo: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  roleId: z.string().uuid('Invalid role ID'),
  phone: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const deviceSchema = z.object({
  deviceToken: z.string().min(1, 'Device token is required'),
  deviceType: z.enum(['ios', 'android', 'web']),
  deviceName: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .refine((p) => p !== 'Employee@123', {
      message: 'New password must be different from the default password',
    }),
});

// ── Helpers ────────────────────────────────────────────

async function getRoleName(roleId: string): Promise<string> {
  const role = await db('roles').where({ id: roleId }).first();
  return role?.name || 'employee';
}

function generateAccessToken(userId: string, role: string, email: string): string {
  return jwt.sign(
    { userId, role, email },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.accessTokenExpiry as jwt.SignOptions['expiresIn'] }
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(
  userId: string,
  rawToken: string,
  deviceInfo?: string
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  );

  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    device_info: deviceInfo || null,
    expires_at: expiresAt,
  });
}

async function rotateRefreshToken(
  oldRawToken: string,
  userId: string,
  deviceInfo?: string
): Promise<string> {
  const oldHash = hashToken(oldRawToken);

  // Delete the old token
  const deleted = await db('refresh_tokens')
    .where({ token_hash: oldHash, user_id: userId })
    .delete();

  if (deleted === 0) {
    throw new AppError('Refresh token not found or already used', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Generate and store new token
  const newRawToken = generateRefreshToken();
  await storeRefreshToken(userId, newRawToken, deviceInfo);

  return newRawToken;
}

// ── Controller Functions ──────────────────────────────

/**
 * POST /api/auth/login
 *
 * Authenticates user with email + password.
 * Returns access token (15min) + refresh token (7 days) + user profile.
 *
 * Rate limited to 5 attempts per minute (configured in auth routes).
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, deviceInfo } = loginSchema.parse(req.body);

    // Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated — contact HR', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isValid = await verifyPassword(user.password_hash, password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await userModel.updateLastLogin(user.id);

    // Look up actual role name
    const roleName = await getRoleName(user.role_id);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, roleName, user.email);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken, deviceInfo);

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: roleName,
          phone: user.phone,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 *
 * Creates a new user account. Admin/HR only (RBAC enforced in routes).
 * Password is Argon2-hashed before storage.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, fullName, roleId, phone } = registerSchema.parse(req.body);

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await userModel.createUser({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role_id: roleId,
      phone,
    });

    logger.info(`User registered: ${user.email}`, { userId: user.id });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          roleId: user.role_id,
          phone: user.phone,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 *
 * Rotates refresh token: invalidates old one, issues new access + refresh tokens.
 * This prevents refresh token replay attacks — each refresh token can only be used once.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    // Find the token hash in DB
    const tokenHash = hashToken(refreshToken);
    const stored = await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .where('expires_at', '>', db.fn.now())
      .first();

    if (!stored) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Get user
    const user = await userModel.findById(stored.user_id);
    if (!user || !user.is_active) {
      throw new AppError('User account is no longer active', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Rotate token (delete old, create new)
    const newRefreshToken = await rotateRefreshToken(
      refreshToken,
      user.id,
      stored.device_info || undefined
    );

    // Get role name
    const roleName = await getRoleName(user.role_id);

    // Issue new access token
    const accessToken = generateAccessToken(user.id, roleName, user.email);

    logger.info(`Token refreshed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/devices
 *
 * Registers a device for push notification targeting.
 * Associates a device token with the authenticated user.
 */
export async function registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceToken, deviceType, deviceName } = deviceSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check if device already registered
    const existing = await db('user_devices')
      .where({ user_id: userId, device_token: deviceToken })
      .first();

    if (existing) {
      // Update last used
      await db('user_devices')
        .where({ id: existing.id })
        .update({ last_used_at: db.fn.now() });

      res.status(200).json({
        success: true,
        data: { message: 'Device already registered — updated last used timestamp' },
      });
      return;
    }

    // Register new device
    await db('user_devices').insert({
      user_id: userId,
      device_token: deviceToken,
      device_type: deviceType,
      device_name: deviceName || null,
    });

    logger.info(`Device registered for user: ${userId}`, { deviceType });

    res.status(201).json({
      success: true,
      data: { message: 'Device registered successfully' },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/change-password
 *
 * Changes the authenticated user's password. Verifies the current password
 * first, then stores the new one (Argon2-hashed). Refresh tokens are kept
 * intact so the session survives the change.
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.user!.userId;

    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValid = await verifyPassword(user.password_hash, currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
    }

    const passwordHash = await hashPassword(newPassword);
    await userModel.updatePassword(userId, passwordHash);

    logger.info(`Password changed for user: ${user.email}`, { userId });
    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 *
 * Invalidates the refresh token (deletes from DB).
 * Client should also discard tokens locally.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await db('refresh_tokens').where({ token_hash: tokenHash }).delete();
    }

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (err) {
    next(err);
  }
}