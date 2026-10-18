import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as SystemUI from 'expo-system-ui';
import { palette, chartPalette, type Colors, type ThemeMode } from './tokens';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { runWebThemeTransition } from './webThemeTransition';

type Origin = { x: number; y: number };

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Colors;
  chart: string[];
  isDark: boolean;
  /** Cambia el tema con la transición circular desde `origin` (coordenadas de ventana). */
  toggleTheme: (origin?: Origin) => void;
  setMode: (mode: ThemeMode, origin?: Origin) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DURATION = 720;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [overlay, setOverlay] = useState<{ color: string; ring: string; origin: Origin; size: number } | null>(null);
  const busy = useRef(false);
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    storage.get<ThemeMode>(STORAGE_KEYS.theme, 'light').then((saved) => {
      if (saved === 'dark' || saved === 'light') setModeState(saved);
    });
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette[mode].bg).catch(() => undefined);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
      document.body.style.backgroundColor = palette[mode].bg;
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', palette[mode].bg);
    }
  }, [mode]);

  const commit = useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.set(STORAGE_KEYS.theme, next);
  }, []);

  const finishNative = useCallback(() => {
    setOverlay(null);
    busy.current = false;
  }, []);

  const setMode = useCallback(
    (next: ThemeMode, origin?: Origin) => {
      if (next === mode || busy.current) return;
      const o = origin ?? { x: width - 40, y: 40 };

      if (Platform.OS === 'web') {
        busy.current = true;
        runWebThemeTransition(o, () => commit(next), DURATION).finally(() => {
          busy.current = false;
        });
        return;
      }

      // Nativo: un círculo del color del nuevo fondo crece desde el origen (con un anillo dorado
      // por delante); al cubrir la pantalla se aplica el tema y el círculo se desvanece.
      busy.current = true;
      const size = 2 * Math.hypot(Math.max(o.x, width - o.x), Math.max(o.y, height - o.y));
      setOverlay({ color: palette[next].bg, ring: palette[next].coin, origin: o, size });
      progress.value = 0;
      fade.value = 1;
      progress.value = withTiming(1, { duration: DURATION, easing: Easing.bezier(0.7, 0, 0.2, 1) }, (done) => {
        if (!done) return;
        scheduleOnRN(commit, next);
        fade.value = withTiming(0, { duration: 280 }, (ok) => {
          if (ok) scheduleOnRN(finishNative);
        });
      });
    },
    [commit, fade, finishNative, height, mode, progress, width],
  );

  const toggleTheme = useCallback((origin?: Origin) => setMode(mode === 'light' ? 'dark' : 'light', origin), [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: palette[mode], chart: chartPalette[mode], isDark: mode === 'dark', toggleTheme, setMode }),
    [mode, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: palette[mode].bg }}>
        {children}
        {overlay ? <ThemeOverlay {...overlay} progress={progress} fade={fade} /> : null}
      </View>
    </ThemeContext.Provider>
  );
}

function ThemeOverlay({
  color,
  ring,
  origin,
  size,
  progress,
  fade,
}: {
  color: string;
  ring: string;
  origin: Origin;
  size: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  fade: ReturnType<typeof useSharedValue<number>>;
}) {
  const circle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: Math.max(progress.value, 0.001) }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * fade.value,
    transform: [{ scale: Math.max(progress.value * 1.06, 0.001) }],
  }));
  const base = {
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    left: origin.x - size / 2,
    top: origin.y - size / 2,
  };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[base, { borderWidth: 18, borderColor: ring }, halo]} />
      <Animated.View style={[base, { backgroundColor: color }, circle]} />
    </View>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
