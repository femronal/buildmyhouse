export async function geocodeArea(address?: string | null): Promise<{ latitude: number; longitude: number } | null> {
  const key = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  const query = String(address || '').trim();
  if (!key || !query) return null;
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:NG&key=${key}`,
    );
    const body = await response.json();
    const location = body?.results?.[0]?.geometry?.location;
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return null;
    return { latitude: location.lat, longitude: location.lng };
  } catch {
    return null;
  }
}
