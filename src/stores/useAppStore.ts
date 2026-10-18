import { create } from 'zustand';
import type { Coords, LocationStatus } from '@/services/location';

interface AppState {
  coords: Coords | null;
  locationStatus: LocationStatus;
  setLocation: (coords: Coords | null, status: LocationStatus) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  coords: null,
  locationStatus: 'undetermined',
  setLocation: (coords, locationStatus) => set({ coords, locationStatus }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
