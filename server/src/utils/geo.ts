/**
 * Deterministic geospatial calculations.
 *
 * Per the ResQ agent boundaries, safety-critical distance/ETA math must stay
 * deterministic and source-backed — it must never be delegated to an LLM.
 */

const EARTH_RADIUS_KM = 6371;

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine great-circle distance between two lat/lng points, in kilometers. */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

/** Rough estimated travel time in minutes given a distance and average speed (km/h). */
export function estimateMinutes(distanceKm: number, avgSpeedKmh = 20): number {
  if (avgSpeedKmh <= 0) return Infinity;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}