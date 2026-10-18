import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, BellRing, CheckCircle2, Info } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { Text } from './Text';
import { Pressable } from './Pressable';

type Kind = 'success' | 'error' | 'info' | 'notification';
interface Toast {
  id: number;
  kind: Kind;
  title: string;
  message?: string;
  onPress?: () => void;
}

const Ctx = createContext<{ show: (t: Omit<Toast, 'id'>) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current;
      setItems((l) => [...l.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.kind === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 10 }]}>
        {items.map((t) => {
          const Icon = { success: CheckCircle2, error: AlertCircle, info: Info, notification: BellRing }[t.kind];
          const fg = { success: colors.mint, error: colors.coral, info: colors.primary, notification: colors.onCoin }[t.kind];
          const iconBg = { success: colors.mintSoft, error: colors.coralSoft, info: colors.primarySoft, notification: colors.coin }[t.kind];
          return (
            <Animated.View key={t.id} entering={FadeInUp.springify().damping(16)} exiting={FadeOutUp.duration(180)} layout={LinearTransition}>
              <Pressable
                pressScale={0.98}
                onPress={() => {
                  t.onPress?.();
                  dismiss(t.id);
                }}
                accessibilityRole="alert"
                style={[styles.toast, elevation(colors, 3), { backgroundColor: colors.surface, borderColor: colors.line }]}
              >
                <View style={[styles.icon, { backgroundColor: iconBg }]}>
                  <Icon size={18} color={fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="smallStrong">{t.title}</Text>
                  {t.message ? (
                    <Text variant="caption" tone="soft" numberOfLines={2}>
                      {t.message}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast requiere <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8, paddingHorizontal: 16, zIndex: 1000 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingRight: 16, borderRadius: radius.lg, borderWidth: 1, width: 420, maxWidth: '100%' },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
