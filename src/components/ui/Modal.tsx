import { useEffect, useState, type ReactNode } from 'react';
import { Modal as RNModal, Platform, Pressable as RNPressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Text } from './Text';
import { IconButton } from './Button';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 'sheet' sube desde abajo en teléfonos; en tablet/escritorio siempre es un diálogo centrado. */
  presentation?: 'sheet' | 'dialog';
  width?: number;
  dismissable?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Modal de la app. Sustituye a alert/confirm del navegador y a Alert de RN (prohibidos).
 * Gestiona áreas seguras, teclado (los inputs dentro siguen visibles) y animación de entrada/salida.
 */
export function Modal({ visible, onClose, title, subtitle, children, footer, presentation = 'sheet', width = 520, dismissable = true, scroll = true, contentStyle }: ModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPhone, height } = useBreakpoint();
  const asSheet = presentation === 'sheet' && isPhone;
  const [mounted, setMounted] = useState(visible);
  const p = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      p.value = withSpring(1, { damping: 22, stiffness: 240, mass: 0.9 });
    } else if (mounted) {
      p.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible, mounted, p]);

  const backdrop = useAnimatedStyle(() => ({ opacity: Math.min(p.value, 1) }));
  const card = useAnimatedStyle(() =>
    asSheet
      ? { transform: [{ translateY: (1 - p.value) * height * 0.6 }] }
      : { opacity: Math.min(p.value * 1.4, 1), transform: [{ scale: 0.94 + p.value * 0.06 }, { translateY: (1 - p.value) * 18 }] },
  );

  if (!mounted) return null;

  const body = scroll ? (
    <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: 16, gap: 14 }, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[{ paddingHorizontal: 20, paddingBottom: 16, gap: 14, flexShrink: 1 }, contentStyle]}>{children}</View>
  );

  return (
    <RNModal transparent visible={mounted} onRequestClose={() => {
        if (dismissable) onClose();
      }} statusBarTranslucent navigationBarTranslucent animationType="none">
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={[styles.root, asSheet ? styles.bottom : styles.center, { paddingTop: insets.top + 12 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdrop]}>
            <RNPressable style={StyleSheet.absoluteFill} onPress={() => dismissable && onClose()} accessibilityLabel="Cerrar" />
          </Animated.View>
          <Animated.View
            accessibilityViewIsModal
            role="dialog"
            aria-modal
            style={[
              styles.card,
              elevation(colors, 3),
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
                maxHeight: asSheet ? height * 0.92 - insets.top : height * 0.86,
                width: asSheet ? '100%' : width,
                maxWidth: '94%',
                borderBottomLeftRadius: asSheet ? 0 : radius.xl,
                borderBottomRightRadius: asSheet ? 0 : radius.xl,
                paddingBottom: asSheet ? insets.bottom : 0,
              },
              asSheet && { maxWidth: '100%' },
              card,
            ]}
          >
            {asSheet ? <View style={[styles.grabber, { backgroundColor: colors.lineStrong }]} /> : null}
            {title || dismissable ? (
              <View style={styles.header}>
                <View style={{ flex: 1, gap: 2 }}>
                  {title ? <Text variant="h3">{title}</Text> : null}
                  {subtitle ? (
                    <Text variant="small" tone="soft">
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                {dismissable ? <IconButton icon={X} label="Cerrar" onPress={onClose} size={36} /> : null}
              </View>
            ) : null}
            {body}
            {footer ? <View style={[styles.footer, { borderTopColor: colors.line }]}>{footer}</View> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  bottom: { justifyContent: 'flex-end' },
  card: { borderRadius: radius.xl, borderWidth: Platform.OS === 'web' ? 1 : 0, overflow: 'hidden' },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1 },
});
