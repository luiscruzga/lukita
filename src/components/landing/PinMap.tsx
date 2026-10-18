import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { BrandLogo } from '../brand/BrandLogo';
import { Text } from '../ui/Text';

const PINS = [
  { x: 0.18, y: 0.3, d: 'copec.cl', n: 'Copec', c: '#E30613', v: '$100' },
  { x: 0.42, y: 0.18, d: 'starbucks.cl', n: 'Starbucks', c: '#00704A', v: '30%' },
  { x: 0.7, y: 0.32, d: 'cruzverde.cl', n: 'Cruz Verde', c: '#009639', v: '25%' },
  { x: 0.3, y: 0.62, d: 'cinemark.cl', n: 'Cinemark', c: '#B5121B', v: '2x1' },
  { x: 0.62, y: 0.7, d: 'jumbo.cl', n: 'Jumbo', c: '#00A443', v: '15%' },
  { x: 0.84, y: 0.56, d: 'juanmaestro.cl', n: 'Juan Maestro', c: '#E4002B', v: '40%' },
  { x: 0.12, y: 0.82, d: 'sodimac.cl', n: 'Sodimac', c: '#F7A800', v: '6 cuotas' },
];

/** Mapa ilustrado: los pines con logos caen uno a uno a medida que la sección entra en pantalla. */
export function PinMap({ progress, height = 380 }: { progress: SharedValue<number>; height?: number }) {
  const { colors, isDark } = useTheme();
  const road = isDark ? '#2A2766' : '#FFFFFF';
  const block = isDark ? '#1C1A47' : '#E9EBF7';
  return (
    <View style={{ height, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: block, borderWidth: 1, borderColor: colors.line }}>
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <Rect x="0" y="0" width="400" height="300" fill={block} />
        <Path d="M-10 90 C 120 70, 220 120, 410 80" stroke={road} strokeWidth="16" fill="none" />
        <Path d="M-10 210 C 140 190, 260 240, 410 200" stroke={road} strokeWidth="12" fill="none" />
        <Path d="M120 -10 C 110 120, 150 200, 130 310" stroke={road} strokeWidth="12" fill="none" />
        <Path d="M290 -10 C 300 100, 260 210, 300 310" stroke={road} strokeWidth="16" fill="none" />
        <Path d="M-10 150 L 410 150" stroke={road} strokeWidth="6" fill="none" />
        <Path d="M210 -10 L 210 310" stroke={road} strokeWidth="6" fill="none" />
        <Path d="M330 230 C 360 250, 380 280, 400 300 L 400 230 Z" fill={isDark ? '#1E3B5A' : '#CFE3FF'} />
      </Svg>
      <Pulse progress={progress} />
      {PINS.map((p, i) => (
        <Pin key={p.n} index={i} progress={progress} {...p} />
      ))}
    </View>
  );
}

function Pulse({ progress }: { progress: SharedValue<number> }) {
  const { colors } = useTheme();
  const s = useAnimatedStyle(() => {
    const t = (progress.value * 6) % 1;
    return { transform: [{ scale: 1 + t * 3 }], opacity: 0.5 * (1 - t) };
  });
  return (
    <View style={{ position: 'absolute', left: '48%', top: '46%' }}>
      <Animated.View style={[{ position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary }, s]} />
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, borderWidth: 4, borderColor: '#fff' }} />
    </View>
  );
}

function Pin({ index, progress, x, y, d, n, c, v }: { index: number; progress: SharedValue<number>; x: number; y: number; d: string; n: string; c: string; v: string }) {
  const { colors } = useTheme();
  const start = 0.12 + index * 0.045;
  const s = useAnimatedStyle(() => {
    const p = interpolate(progress.value, [start, start + 0.08], [0, 1], Extrapolation.CLAMP);
    const bounce = p < 1 ? p * 1.15 - Math.max(0, p - 0.85) : 1;
    return { opacity: p, transform: [{ translateY: (1 - p) * -60 }, { scale: Math.min(bounce, 1.08) }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, alignItems: 'center' }, s]}>
      <View style={{ position: 'absolute', top: -14, right: -26, backgroundColor: colors.coin, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, zIndex: 2 }}>
        <Text variant="caption" style={{ color: colors.onCoin, fontSize: 11 }}>
          {v}
        </Text>
      </View>
      <View style={{ width: 46, height: 46, borderRadius: 16, borderBottomLeftRadius: 4, transform: [{ rotate: '-45deg' }], backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c }}>
        <View style={{ transform: [{ rotate: '45deg' }] }}>
          <BrandLogo name={n} domain={d} color={c} size={34} shape="circle" />
        </View>
      </View>
    </Animated.View>
  );
}
