import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { LogoMark } from '../brand/Logo';
import { BrandLogo } from '../brand/BrandLogo';
import { Text } from '../ui/Text';
import { useLandingScroll } from './scroll';

const TICKETS = [
  { v: '40%', t: 'Sushi los martes', p: 'Banco de Chile', d: 'bancochile.cl', c: '#002D72', angle: -16, x: -150, y: -110 },
  { v: '$100', t: 'por litro, jueves', p: 'Copec', d: 'copec.cl', c: '#E30613', angle: 12, x: 150, y: -70 },
  { v: '25%', t: 'en farmacia', p: 'Caja Los Andes', d: 'cajalosandes.cl', c: '#0072BC', angle: -8, x: -130, y: 120 },
  { v: '2x1', t: 'cine miércoles', p: 'Entel', d: 'entel.cl', c: '#FF6600', angle: 14, x: 140, y: 140 },
];

/** Moneda gigante que gira con el scroll mientras los cupones se abren en abanico a su alrededor. */
export function HeroVisual({ size = 440 }: { size?: number }) {
  const { colors } = useTheme();
  const { y } = useLandingScroll();
  const k = size / 440;
  const coin = useAnimatedStyle(() => ({ transform: [{ rotate: `${y.value * 0.25}deg` }, { scale: interpolate(y.value, [0, 500], [1, 0.8], Extrapolation.CLAMP) }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ position: 'absolute', width: size * 0.9, height: size * 0.9, borderRadius: size, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.lineStrong }} />
      <Animated.View style={coin}>
        <LogoMark size={size * 0.5} />
      </Animated.View>
      {TICKETS.map((t, i) => (
        <FanTicket key={t.v} index={i} {...t} k={k} bg={i === 1 ? colors.coin : colors.surface} />
      ))}
    </View>
  );
}

function FanTicket({ index, v, t, p, d, c, angle, x, y: ty, k, bg }: { index: number; v: string; t: string; p: string; d: string; c: string; angle: number; x: number; y: number; k: number; bg: string }) {
  const { colors } = useTheme();
  const { y } = useLandingScroll();
  const s = useAnimatedStyle(() => {
    const spread = interpolate(y.value, [0, 420], [1, 1.45], Extrapolation.CLAMP);
    const float = Math.sin(y.value / 90 + index) * 6;
    return {
      position: 'absolute',
      transform: [{ translateX: x * k * spread }, { translateY: ty * k * spread + float }, { rotate: `${angle + interpolate(y.value, [0, 420], [0, angle * 0.8])}deg` }, { scale: Math.min(1, k * 1.05) }],
      opacity: interpolate(y.value, [300, 620], [1, 0], Extrapolation.CLAMP),
    };
  });
  return (
    <Animated.View style={[s, { flexDirection: 'row', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, shadowColor: colors.shadow, shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 }]}>
      <View style={{ width: 84, backgroundColor: bg === colors.surface ? colors.primary : bg, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
        <Text variant="h3" style={{ color: bg === colors.surface ? colors.onPrimary : colors.onCoin }}>
          {v}
        </Text>
      </View>
      <View style={{ padding: 12, gap: 6, borderLeftWidth: 2, borderStyle: 'dashed', borderLeftColor: colors.lineStrong, width: 170 }}>
        <Text variant="smallStrong" numberOfLines={1}>
          {t}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BrandLogo name={p} domain={d} color={c} size={18} shape="circle" />
          <Text variant="caption" tone="soft" numberOfLines={1}>
            {p}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
