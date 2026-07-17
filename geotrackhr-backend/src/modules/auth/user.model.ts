import knex from 'knex';
import { knexfile } from '@database/knexfile';
import { AppError } from '@middleware/errorHandler';

/**
 * User data-access layer.
 *
 * Thin abstraction over Knex for user-related queries.
 * All functions return plain objects — no ORM hydration.
 *
 * The db instance is created from the knexfile config.
 * In production, this would be a singleton imported from a
 * shared db module; for now, each model creates its own
 * instance (Knex connection pooling handles this efficiently).
 */

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] || knexfile.development);

// ── Types ──────────────────────────────────────────────

export interface UserRecord {
  id: string;
  role_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  role_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface CreateUserInput {
  role_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
}

// ── Queries ────────────────────────────────────────────

/**
 * Find a user by email. Returns the full record including password_hash.
 * Used during login for credential verification.
 */
export async function findByEmail(email: string): Promise<UserRecord | null> {
  const user = await db('users')
    .where({ email: email.toLowerCase().trim() })
    .first();

  return user || null;
}

/**
 * Find a user by ID. Returns the full record including password_hash.
 */
export async function findById(id: string): Promise<UserRecord | null> {
  const user = await db('users').where({ id }).first();
  return user || null;
}

/**
 * Create a new user. Returns the created user profile (without password_hash).
 * Throws AppError if email already exists.
 */
export async function createUser(input: CreateUserInput): Promise<UserProfile> {
  const existing = await findByEmail(input.email);
  if (existing) {
    throw new AppError('A user with this email already exists', 409, 'EMAIL_EXISTS');
  }

  const [created] = await db('users')
    .insert({
      role_id: input.role_id,
      email: input.email.toLowerCase().trim(),
      password_hash: input.password_hash,
      full_name: input.full_name,
      phone: input.phone || null,
    })
    .returning(['id', 'role_id', 'email', 'full_name', 'phone', 'is_active', 'last_login_at', 'created_at']);

  return created;
}

/**
 * Update the last_login_at timestamp for a user.
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await db('users').where({ id: userId }).update({
    last_login_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
}

/**
 * Get user profile by ID (safe version without password_hash).
 */
export async function getProfile(id: string): Promise<UserProfile | null> {
  const user = await db('users')
    .where({ id })
    .select('id', 'role_id', 'email', 'full_name', 'phone', 'is_active', 'last_login_at', 'created_at')
    .first();

  return user || null;
}

/**
 * Check if a user exists by email.
 */
export async function existsByEmail(email: string): Promise<boolean> {
  const count = await db('users')
    .where({ email: email.toLowerCase().trim() })
    .count('id as count')
    .first();

  return Number(count?.count) > 0;
}