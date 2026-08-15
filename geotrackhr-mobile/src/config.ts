/**
 * GeoTrackHR API base URL.
 *
 * Points at the hosted Render backend so built APKs talk to the live API.
 * For local development against a machine-run server, swap this to
 * `http://${DEV_HOST}:3000/api` with DEV_HOST = 10.0.2.2 (Android emulator)
 * or localhost (iOS simulator / physical device on the dev LAN).
 */
export const API_BASE_URL: string = 'https://geotrackhr-api.onrender.com/api';

/** Hard timeout for uploads / slow networks */
export const REQUEST_TIMEOUT_MS = 20_000;
