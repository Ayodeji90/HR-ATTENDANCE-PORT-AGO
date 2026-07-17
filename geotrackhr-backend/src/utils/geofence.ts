/**
 * Geofence utilities – Haversine distance calculation and point‑in‑circle check.
 * All distances are in meters.
 */

/** Earth radius in meters */
const EARTH_RADIUS = 6371000;

/**
 * Compute the great‑circle distance between two latitude/longitude points using the
 * Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Returns true if the point (lat, lon) lies within the given radius (meters)
 * of the centre point (centerLat, centerLon).
 */
export function isWithinGeofence(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
): boolean {
  const distance = haversineDistance(lat, lon, centerLat, centerLon);
  return distance <= radiusMeters;
}
