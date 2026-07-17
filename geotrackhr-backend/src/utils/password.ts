import argon2 from 'argon2';
import { authConfig } from '@config/auth';

/**
 * Password hashing and verification utilities.
 *
 * Uses Argon2id (the hybrid mode combining Argon2d and Argon2i):
 * - Argon2d: data-dependent memory access, best against GPU attacks
 * - Argon2i: data-independent memory access, best against side-channel attacks
 * - Argon2id: hybrid — Argon2i for first pass, Argon2d for subsequent passes
 *
 * Parameters from authConfig (OWASP recommended defaults):
 * - memoryCost: 64 MiB RAM per hash
 * - timeCost: 3 iterations
 * - parallelism: 4 lanes
 * - hashLength: 32 bytes (256-bit) default
 *
 * The raw hash string includes the algorithm, version, parameters, salt,
 * and digest — all in one self-contained string. No need to store salt
 * separately.
 */

/**
 * Hash a plaintext password with Argon2id.
 * Returns the full encoded hash string (e.g. "$argon2id$v=19$m=65536,t=3,p=4$...")
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: authConfig.argon2.memoryCost,
    timeCost: authConfig.argon2.timeCost,
    parallelism: authConfig.argon2.parallelism,
  });
}

/**
 * Verify a plaintext password against an Argon2 hash.
 * Uses constant-time comparison internally — safe against timing attacks.
 * Returns true if the password matches, false otherwise.
 */
export async function verifyPassword(
  hash: string,
  plaintext: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    // Invalid hash format or corrupted hash
    return false;
  }
}