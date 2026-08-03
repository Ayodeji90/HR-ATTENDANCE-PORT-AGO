import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OfflinePunch } from '../types';

const QUEUE_KEY = 'geotrackhr-attendance-queue';

/**
 * Persistent queue of attendance punches captured while offline. When
 * connectivity returns, the sync manager replays them through
 * POST /attendance/sync (which applies the same geofence + time-window
 * rules, keyed off each item's client_timestamp).
 */
export const offlineStorage = {
  async enqueue(punch: OfflinePunch): Promise<OfflinePunch[]> {
    const queue = await this.getQueue();
    const next = [...queue, punch];
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
    return next;
  },

  async getQueue(): Promise<OfflinePunch[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    try {
      const parsed = raw ? (JSON.parse(raw) as OfflinePunch[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async replace(queue: OfflinePunch[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },
};
