import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

/**
 * Zustand store that persists authentication data using AsyncStorage.
 * Matches the backend login contract: { accessToken, refreshToken, user }.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'geotrackhr-auth', // storage key
      getStorage: () => AsyncStorage,
    }
  )
);
