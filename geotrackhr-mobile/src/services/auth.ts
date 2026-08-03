import { api } from './api';
import type { AuthResponse } from '../types';

/** POST /auth/login — returns access + refresh tokens and the user profile */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post('/auth/login', { email, password, deviceInfo: 'mobile' });
  return response.data.data as AuthResponse;
}

/** POST /auth/logout — invalidate the refresh token server-side */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await api.post('/auth/logout', { refreshToken });
  } catch {
    // Best effort — the client clears its session regardless.
  }
}

export interface SelfRegistrationPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  hire_date?: string;
}

/**
 * POST /employees/register — public self-registration (multipart form).
 * Does NOT create a login account: the record lands in the pending queue and
 * HR must approve it before the employee can log in.
 */
export async function selfRegister(
  payload: SelfRegistrationPayload,
  photo?: { uri: string; name: string; type: string } | null
): Promise<{ employeeId: string; status: string }> {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });
  if (photo) {
    form.append('passport_photo', {
      uri: photo.uri,
      name: photo.name,
      type: photo.type,
    } as unknown as Blob);
  }

  const response = await api.post('/employees/register', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data as { employeeId: string; status: string };
}
