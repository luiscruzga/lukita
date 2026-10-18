import { useMemo, type ReactNode } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, type Theme } from 'expo-router';
import { useTheme } from './ThemeProvider';

/**
 * Sincroniza el tema de React Navigation (fondo de cada pantalla del Stack, tarjetas, bordes) con
 * el de Lukita. Sin esto, las pantallas usan el gris claro por defecto aunque la app esté en oscuro.
 */
export function NavigationTheme({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const theme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: { ...base.colors, primary: colors.primary, background: colors.bg, card: colors.surface, text: colors.ink, border: colors.line, notification: colors.coral },
    };
  }, [colors, isDark]);
  return <NavThemeProvider value={theme}>{children}</NavThemeProvider>;
}
