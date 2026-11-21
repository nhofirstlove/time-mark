import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { create } from 'zustand';

import i18n from '@/i18n';
import type { LocationDetail } from '@/store/settings';

import { reverseGeocodeWeb } from './geocodeWeb';

export type LocationStatus = 'idle' | 'loading' | 'ok' | 'denied' | 'error';

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  status: LocationStatus;
  coords: Coords | null;
  address: Location.LocationGeocodedAddress | null;
  refresh: () => Promise<void>;
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

let inflight: Promise<void> | null = null;

export const useLocation = create<LocationState>()((set) => ({
  status: 'idle',
  coords: null,
  address: null,

  refresh: () => {
    if (inflight) return inflight;
    inflight = (async () => {
      set({ status: 'loading' });
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          set({ status: 'denied' });
          return;
        }
        // A cached fix shows something immediately; a fresh one follows.
        const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
        if (last) set({ coords: last.coords });
        const pos = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          15_000,
        ).catch(() => last);
        if (!pos) throw new Error('no position');
        set({ coords: pos.coords, status: 'ok' });
        // Reverse geocoding needs internet; on failure we keep coordinates.
        const lookup =
          Platform.OS === 'web'
            ? reverseGeocodeWeb(pos.coords, i18n.language)
            : Location.reverseGeocodeAsync(pos.coords);
        const results = await withTimeout(lookup, 10_000).catch(() => []);
        set({ address: results[0] ?? null });
      } catch {
        set({ status: 'error' });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
}));

const uniq = (parts: (string | null | undefined)[]) => {
  const out: string[] = [];
  for (const p of parts) {
    const v = p?.trim();
    if (v && !out.some((o) => o.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out;
};

export function formatCoords(c: Coords): string {
  const lat = `${Math.abs(c.latitude).toFixed(5)}° ${c.latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(c.longitude).toFixed(5)}° ${c.longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}`;
}

/** Turns the current fix into the label shown on the stamp. */
export function placeLabel(
  coords: Coords | null,
  address: Location.LocationGeocodedAddress | null,
  detail: LocationDetail,
): string {
  if (!coords) return '';
  if (detail === 'coords' || !address) return formatCoords(coords);
  if (detail === 'short') {
    return uniq([address.city ?? address.subregion ?? address.region, address.country]).join(', ');
  }
  if (address.formattedAddress) return address.formattedAddress;
  const street = uniq([address.streetNumber, address.street]).join(' ');
  return uniq([
    address.name !== address.street ? address.name : null,
    street,
    address.district,
    address.city ?? address.subregion,
    address.region,
    address.country,
  ]).join(', ');
}

/** Convenience hook: the label for the user's chosen detail level. */
export function useLocationLabel(detail: LocationDetail) {
  const { coords, address, status } = useLocation();
  return { label: placeLabel(coords, address, detail), status };
}
