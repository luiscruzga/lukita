/**
 * Tokens de diseño de Lukita. Única fuente de verdad para colores, tipografía, radios y sombras.
 * Ver STYLES.md antes de añadir o cambiar un token.
 */
export type ThemeMode = 'light' | 'dark';

export const palette = {
  light: {
    bg: '#F4F5FB',
    surface: '#FFFFFF',
    surfaceAlt: '#ECEEF8',
    surfaceSunken: '#E3E5F3',
    ink: '#16133F',
    inkSoft: '#56547E',
    inkMuted: '#8E8CAD',
    line: '#DEDFEE',
    lineStrong: '#C6C7E0',
    primary: '#2B1FA8',
    primaryHover: '#22188A',
    primarySoft: '#E6E3FF',
    onPrimary: '#FFFFFF',
    coin: '#FFB81C',
    coinSoft: '#FFF1CC',
    onCoin: '#2A1C00',
    mint: '#0B9A6F',
    mintSoft: '#D8F5EA',
    coral: '#D93B41',
    coralSoft: '#FDE3E4',
    sky: '#2F7BF2',
    skySoft: '#DDEBFF',
    overlay: 'rgba(22, 19, 63, 0.48)',
    shadow: '#1B1660',
    skeletonBase: '#E6E8F4',
    skeletonShine: '#F7F8FD',
  },
  dark: {
    bg: '#100E2E',
    surface: '#19173F',
    surfaceAlt: '#221F52',
    surfaceSunken: '#0B0A22',
    ink: '#F1F0FF',
    inkSoft: '#B5B3DA',
    inkMuted: '#7D7AA8',
    line: '#2E2B63',
    lineStrong: '#433F82',
    primary: '#8F84FF',
    primaryHover: '#A69DFF',
    primarySoft: '#2A2566',
    onPrimary: '#100E2E',
    coin: '#FFC94A',
    coinSoft: '#3A2F12',
    onCoin: '#2A1C00',
    mint: '#34D399',
    mintSoft: '#123B33',
    coral: '#FF6B6F',
    coralSoft: '#43192A',
    sky: '#6AA6FF',
    skySoft: '#172A55',
    overlay: 'rgba(4, 3, 18, 0.66)',
    shadow: '#000000',
    skeletonBase: '#221F52',
    skeletonShine: '#2E2A66',
  },
} as const;

export type Colors = { [K in keyof typeof palette.light]: string };

/** Paleta categórica para gráficos (orden fijo: no reordenar, los gráficos dependen del índice). */
export const chartPalette: Record<ThemeMode, string[]> = {
  light: ['#2B1FA8', '#FFB81C', '#0B9A6F', '#D93B41', '#2F7BF2', '#A23CC2', '#7A8499'],
  dark: ['#8F84FF', '#FFC94A', '#34D399', '#FF6B6F', '#6AA6FF', '#D47CF0', '#9AA3B8'],
};

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;

/** Escala tipográfica modular (ratio ~1.25). */
export const type = {
  hero: { fontFamily: fonts.displayHeavy, fontSize: 56, lineHeight: 58, letterSpacing: -1.6 },
  h1: { fontFamily: fonts.displayHeavy, fontSize: 36, lineHeight: 40, letterSpacing: -0.9 },
  h2: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  h3: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27, letterSpacing: -0.3 },
  title: { fontFamily: fonts.displayMedium, fontSize: 18, lineHeight: 23, letterSpacing: -0.1 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  number: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
} as const;

export type TypeVariant = keyof typeof type;

/** Radios jerárquicos: cuanto más grande el contenedor, más radio. */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const breakpoints = {
  tablet: 768,
  desktop: 1100,
  wide: 1440,
} as const;

/** Sombras teñidas con el color de marca (nunca gris neutro). */
export function elevation(colors: Colors, level: 0 | 1 | 2 | 3) {
  if (level === 0) return {};
  const map = {
    1: { radius: 8, opacity: 0.06, y: 2, el: 2 },
    2: { radius: 18, opacity: 0.1, y: 8, el: 6 },
    3: { radius: 36, opacity: 0.18, y: 18, el: 14 },
  }[level];
  return {
    shadowColor: colors.shadow,
    shadowOpacity: map.opacity,
    shadowRadius: map.radius,
    shadowOffset: { width: 0, height: map.y },
    elevation: map.el,
  };
}

export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 140, mass: 1 },
} as const;
