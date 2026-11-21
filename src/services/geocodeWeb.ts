import type { LocationGeocodedAddress } from 'expo-location';

/**
 * Browsers have no built-in reverse geocoder (expo-location's is native-only),
 * so on web we ask OpenStreetMap's free Nominatim service. Its usage policy asks
 * for light use (≤1 request/second) and attribution, shown in Settings.
 */
export async function reverseGeocodeWeb(
  coords: { latitude: number; longitude: number },
  lang: string,
): Promise<LocationGeocodedAddress[]> {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18' +
    `&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=${encodeURIComponent(lang)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const json = (await res.json()) as {
    name?: string;
    address?: Record<string, string | undefined>;
  };
  const a = json.address;
  if (!a) return [];
  return [
    {
      name: json.name || null,
      street: a.road ?? a.pedestrian ?? null,
      streetNumber: a.house_number ?? null,
      district: a.suburb ?? a.city_district ?? a.quarter ?? a.neighbourhood ?? null,
      city: a.city ?? a.town ?? a.village ?? a.municipality ?? null,
      subregion: a.county ?? a.state_district ?? null,
      region: a.state ?? a.province ?? a.region ?? null,
      postalCode: a.postcode ?? null,
      country: a.country ?? null,
      isoCountryCode: a.country_code?.toUpperCase() ?? null,
      timezone: null,
      formattedAddress: null,
    },
  ];
}
