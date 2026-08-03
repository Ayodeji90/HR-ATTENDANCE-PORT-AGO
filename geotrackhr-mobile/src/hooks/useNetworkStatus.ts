import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Subscribes to connectivity changes. `isOnline` becomes true as soon as a
 * network connection exists; `isInternetReachable` additionally requires a
 * working internet route.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });
    return unsubscribe;
  }, []);

  return { isOnline, isInternetReachable };
}
