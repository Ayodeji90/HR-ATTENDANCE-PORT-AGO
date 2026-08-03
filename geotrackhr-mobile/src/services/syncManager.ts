import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from './offlineStorage';
import { syncOfflinePunches } from './attendance';

let flushing = false;

/**
 * Replays every queued punch through POST /attendance/sync. Successful items
 * are dropped from the queue; failed items (e.g. still outside a time window)
 * are retained so the user can see why in their history and retry later.
 */
export async function flushOfflineQueue(): Promise<number> {
  if (flushing) return 0;
  const queue = await offlineStorage.getQueue();
  if (queue.length === 0) return 0;

  flushing = true;
  try {
    const results = await syncOfflinePunches(queue);
    const syncedIndexes = new Set(
      results.filter((r) => r.success).map((r) => r.index)
    );
    const remaining = queue.filter((_, index) => !syncedIndexes.has(index));
    await offlineStorage.replace(remaining);
    return syncedIndexes.size;
  } finally {
    flushing = false;
  }
}

let listenerRegistered = false;

/**
 * Registers a one-time NetInfo listener that flushes the queue whenever the
 * device comes back online. Safe to call multiple times.
 */
export function initSyncListener(): () => void {
  if (listenerRegistered) return () => {};
  listenerRegistered = true;

  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      void flushOfflineQueue();
    }
  });

  return () => {
    listenerRegistered = false;
    unsubscribe();
  };
}
