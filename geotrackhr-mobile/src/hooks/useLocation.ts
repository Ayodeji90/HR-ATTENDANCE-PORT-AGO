import { useCallback, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

/**
 * React Native geolocation hook.
 *
 * Requests location permission (Android runtime permission / iOS usage
 * prompt), then resolves the current position with a single-shot GPS fix.
 * `refresh()` re-acquires the position for repeat punches.
 */
export function useLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        { title: 'Location access', message: 'GeoTrackHR needs your location to verify attendance.', buttonPositive: 'Allow' }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted';
    }
    return false;
  }, []);

  const refresh = useCallback(async (): Promise<Coordinates | null> => {
    setLoading(true);
    setError(null);
    try {
      const permitted = await requestPermission();
      if (!permitted) {
        setError('Location permission denied. Enable location to check in.');
        return null;
      }

      const position: GeoPosition = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
      });

      const next: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      };
      setCoords(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to get your location');
      return null;
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  return { coords, loading, error, refresh };
}
