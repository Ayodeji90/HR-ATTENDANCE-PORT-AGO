import { Platform } from 'react-native';

/**
 * GeoTrackHR API base URL.
 *
 * ── BEFORE BUILDING A SHARABLE APK ─────────────────────────
 * Point this at your hosted backend so the app talks to the live API:
 *
 *   const API_BASE_URL = 'https://geotrackhr-api.onrender.com/api';
 *
 * (Use the HTTPS URL — Android blocks plain-HTTP by default.)
 * ────────────────────────────────────────────────────────────
 *
 * Local development defaults:
 * - Android emulator reaches the host machine via 10.0.2.2
 * - iOS simulator shares the host network and can use localhost
 * - A physical device needs the dev machine's LAN IP — set DEV_HOST to it.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL: string = `http://${DEV_HOST}:3000/api`;

/** Hard timeout for uploads / slow networks */
export const REQUEST_TIMEOUT_MS = 20_000;
