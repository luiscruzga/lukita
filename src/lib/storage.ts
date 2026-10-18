import AsyncStorage from '@react-native-async-storage/async-storage';

/** Envoltorio tolerante a fallos: el almacenamiento puede no existir (modo privado, previews). */
export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  async set(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sin almacenamiento disponible: la preferencia vive solo en memoria
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignorado
    }
  },
};

export const STORAGE_KEYS = {
  theme: '@lukita/theme',
  sidebarCollapsed: '@lukita/sidebar-collapsed',
  autoUpdates: '@lukita/auto-updates',
  lastUpdateCheck: '@lukita/last-update-check',
  onboardingDone: '@lukita/onboarding-done',
  lastLocation: '@lukita/last-location',
  pushRegistered: '@lukita/push-registered',
} as const;
