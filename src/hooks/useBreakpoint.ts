import { useWindowDimensions } from 'react-native';
import { breakpoints } from '@/theme/tokens';

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= breakpoints.tablet;
  const isDesktop = width >= breakpoints.desktop;
  return {
    width,
    height,
    isPhone: !isTablet,
    isTablet: isTablet && !isDesktop,
    isDesktop,
    isWide: width >= breakpoints.wide,
    /** Columnas sugeridas para rejillas de contenido. */
    columns: width >= breakpoints.wide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1,
  };
}
