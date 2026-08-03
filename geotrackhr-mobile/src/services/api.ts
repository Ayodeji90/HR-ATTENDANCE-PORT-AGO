import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config';
import { useAuthStore } from '../store/authStore';

/**
 * Shared axios instance for all GeoTrackHR API calls.
 *
 * - Attaches the Bearer access token on every request.
 * - On 401, performs a single in-flight refresh-token rotation and replays
 *   the original request. If refresh fails, the session is cleared and the
 *   root navigator (which keys off the token) returns to the Login screen.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = response.data.data;
  useAuthStore.setState({ accessToken, refreshToken: newRefreshToken });
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

/** Extract a human-readable message from an axios error (incl. API error bodies) */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message ?? data?.message ?? err.message ?? 'Something went wrong';
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
