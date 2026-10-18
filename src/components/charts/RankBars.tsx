import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

/** Ranking horizontal con avatar/logo a la izquierda (proveedores que más te ahorran). */
export function RankBars({ data, format = (n: number) => String(n) }: { data: { label: string; value: number; leading?: ReactNode; color?: string }[]; format?: (n: number) => string }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: 12 }}>
      {data.map((d, i) => (
        <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {d.leading}
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="smallStrong" numberOfLines={1} style={{ flex: 1 }}>
                {d.label}
              </Text>
              <Text variant="smallStrong" tone="soft">
                {format(d.value)}
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
              <Fill ratio={d.value / max} delay={i * 80} color={d.color ?? colors.primary} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function Fill({ ratio, delay, color }: { ratio: number; delay: number; color: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(ratio, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [delay, ratio, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color }, style]} />;
}
