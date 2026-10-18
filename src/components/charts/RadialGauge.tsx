import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

const ACircle = Animated.createAnimatedComponent(Circle);

/** Medidor radial de meta (p. ej. ahorro del mes vs. meta). Arco de 270°. */
export function RadialGauge({ value, goal, size = 170, label, display }: { value: number; goal: number; size?: number; label?: string; display?: string }) {
  const { colors } = useTheme();
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(ratio, { duration: 1200, easing: Easing.out(Easing.exp) });
  }, [p, ratio]);
  const props = useAnimatedProps(() => ({ strokeDasharray: [arc * p.value, c] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '135deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" strokeDasharray={[arc, c]} strokeLinecap="round" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={ratio >= 1 ? colors.mint : colors.coin} strokeWidth={stroke} fill="none" strokeLinecap="round" animatedProps={props} />
      </Svg>
      <Text variant="h2">{display ?? `${Math.round(ratio * 100)}%`}</Text>
      {label ? (
        <Text variant="caption" tone="soft" align="center" style={{ maxWidth: size * 0.6 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
