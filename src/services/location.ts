import * as Location from 'expo-location';
import { storage, STORAGE_KEYS } from '@/lib/storage';

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number | null;
}

/** Plaza de Armas de Santiago: punto por defecto si el usuario no comparte su ubicación. */
export const DEFAULT_COORDS: Coords = { lat: -33.4378, lng: -70.6505 };

export type LocationStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getPermissionStatus(): Promise<LocationStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'unavailable';
  }
}

/** Pide permiso (diálogo nativo del sistema / navegador) y devuelve la posición actual. */
export async function requestCurrentPosition(): Promise<{ status: LocationStatus; coords: Coords | null }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { status: status === 'denied' ? 'denied' : 'undetermined', coords: null };
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 }).catch(() => null);
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    storage.set(STORAGE_KEYS.lastLocation, coords);
    return { status: 'granted', coords };
  } catch {
    return { status: 'unavailable', coords: null };
  }
}

export async function watchPosition(onChange: (c: Coords) => void) {
  try {
    const sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 150, timeInterval: 30_000 }, (pos) =>
      onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    );
    return () => sub.remove();
  } catch {
    return () => undefined;
  }
}

export const getLastKnown = () => storage.get<Coords | null>(STORAGE_KEYS.lastLocation, null);
