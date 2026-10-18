import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Logo, Wordmark } from '../brand/Logo';
import { Screen } from '../ui/Screen';
import { Text } from '../ui/Text';
import { IconButton } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';

const SAMPLE = [
  { v: '40%', s: 'Martes en sushi', c: 'coin' },
  { v: '$100', s: 'por litro, jueves', c: 'mint' },
  { v: '6', s: 'cuotas sin interés', c: 'primary' },
  { v: '2x1', s: 'cine los miércoles', c: 'coral' },
] as const;

/** Marco de las pantallas de acceso: panel de marca a la izquierda (escritorio) y formulario. */
export function AuthFrame({ title, subtitle, children, back }: { title: string; subtitle?: string; children: ReactNode; back?: boolean }) {
  const { colors } = useTheme();
  const { isDesktop, isPhone } = useBreakpoint();
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {isDesktop ? <BrandPanel /> : null}
      <View style={{ flex: 1 }}>
        <Screen keyboard maxWidth={480} contentStyle={{ gap: 22, paddingBottom: 48, minHeight: '100%', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {back ? <IconButton icon={ArrowLeft} label="Volver" onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} /> : isDesktop ? <View /> : <Logo size={34} />}
            <ThemeToggle />
          </View>
          <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))} style={{ gap: 6, marginTop: isPhone ? 8 : 0 }}>
            <Text variant="h1">{title}</Text>
            {subtitle ? <Text tone="soft">{subtitle}</Text> : null}
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(90).duration(420)} style={{ gap: 16 }}>
            {children}
          </Animated.View>
        </Screen>
      </View>
    </View>
  );
}

function BrandPanel() {
  const { colors } = useTheme();
  return (
    <View style={{ width: '44%', maxWidth: 640, backgroundColor: colors.primary, padding: 48, justifyContent: 'space-between', overflow: 'hidden' }}>
      <Wordmark size={40} color="#FFFFFF" />
      <View style={{ gap: 14 }}>
        {SAMPLE.map((s, i) => (
          <FloatingTicket key={s.v} index={i} value={s.v} label={s.s} tone={s.c} />
        ))}
      </View>
      <Text variant="h2" style={{ color: '#FFFFFF', maxWidth: 420 }}>
        Tus tarjetas, tu caja y tu compañía de teléfono ya te dan descuentos. Lukita te dice dónde y cuándo usarlos.
      </Text>
    </View>
  );
}

function FloatingTicket({ index, value, label, tone }: { index: number; value: string; label: string; tone: 'coin' | 'mint' | 'primary' | 'coral' }) {
  const { colors } = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 2600 + index * 400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [index, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * 10 - 5 }, { rotate: `${(index % 2 ? 1 : -1) * (2 + y.value * 1.5)}deg` }] }));
  const bg = { coin: colors.coin, mint: '#34D399', primary: '#FFFFFF', coral: '#FF8A8D' }[tone];
  return (
    <Animated.View entering={FadeInDown.delay(150 + index * 120).springify()} style={[{ alignSelf: index % 2 ? 'flex-end' : 'flex-start', flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: radius.lg, overflow: 'hidden', width: 300 }, st]}>
      <View style={{ width: 92, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
        <Text variant="h2" style={{ color: '#16133F' }}>
          {value}
        </Text>
      </View>
      <View style={{ flex: 1, padding: 16, justifyContent: 'center', borderLeftWidth: 2, borderStyle: 'dashed', borderLeftColor: '#C6C7E0' }}>
        <Text variant="bodyStrong" style={{ color: '#16133F' }}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}
