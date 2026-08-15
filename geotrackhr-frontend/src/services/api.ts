import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * API base URL.
 * - Development: Vite proxies /api → http://localhost:3000 (vite.config.ts).
 * - Production: VITE_API_BASE_URL is baked in at build time. The repo ships
 *   .env.production pointing at the Render backend, and a Netlify dashboard
 *   variable overrides it if ever set.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-token handling: on a 401, try refreshing the access token once and
// replaying the original request. Concurrent 401s share a single in-flight
// refresh instead of each firing their own /auth/refresh call.
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

    if (status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
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
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// Export the axios instance as the default export so that modules can
// import it via `import api from '@/services/api'`.
export default api;

export const login = async (payload: { email: string; password: string }) => {
  const response = await api.post('/auth/login', payload);
  return response.data.data;
};

export const logout = async (refreshToken: string) => {
  await api.post('/auth/logout', { refreshToken });
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};
