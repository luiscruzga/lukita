import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Props {
  children: ReactNode;
  /** Pantallas con formularios: el contenido sube con el teclado y el campo activo queda visible. */
  keyboard?: boolean;
  scroll?: boolean;
  /** Ancho máximo del contenido en escritorio. */
  maxWidth?: number;
  padded?: boolean;
  /** Espacio superior para la barra de estado. Desactívalo si un header ya lo aplica. */
  topInset?: boolean;
  bottomInset?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Contenedor de pantalla: respeta las áreas seguras (barra de estado con hora/wifi/batería y barra
 * de navegación del sistema) y evita que el teclado tape los campos.
 */
export function Screen({ children, keyboard, scroll = true, maxWidth = 1180, padded = true, topInset = true, bottomInset = true, refreshing, onRefresh, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isPhone } = useBreakpoint();
  const pad = padded ? (isPhone ? 16 : 28) : 0;
  const inner: StyleProp<ViewStyle> = [
    {
      paddingTop: (topInset ? insets.top : 0) + (padded ? (isPhone ? 12 : 24) : 0),
      paddingBottom: (bottomInset ? insets.bottom : 0) + (padded ? 96 : 0),
      paddingHorizontal: pad,
      width: '100%',
      maxWidth,
      alignSelf: 'center',
    },
    contentStyle,
  ];

  if (!scroll) return <View style={[styles.fill, { backgroundColor: colors.bg }, inner]}>{children}</View>;

  const refresh = onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined;

  if (keyboard) {
    return (
      <KeyboardAwareScrollView
        style={[styles.fill, { backgroundColor: colors.bg }]}
        contentContainerStyle={inner}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        refreshControl={refresh}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }
  return (
    <ScrollView style={[styles.fill, { backgroundColor: colors.bg }]} contentContainerStyle={inner} keyboardShouldPersistTaps="handled" refreshControl={refresh}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
