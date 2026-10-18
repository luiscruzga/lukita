import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

/** Barras verticales que crecen con muelle escalonado. La barra destacada usa el dorado. */
export function BarChart({ data, height = 180, format = (n: number) => String(n) }: { data: Bar[]; height?: number; format?: (n: number) => string }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  const [active, setActive] = useState<number | null>(null);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      {data.map((d, i) => (
        <Pressable key={d.label + i} pressScale={0.96} onPress={() => setActive(active === i ? null : i)} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }} accessibilityLabel={`${d.label}: ${format(d.value)}`}>
          <Text variant="caption" tone={active === i || d.highlight ? 'ink' : 'muted'} numberOfLines={1} style={{ fontSize: 10 }}>
            {active === i || d.highlight ? format(d.value) : ''}
          </Text>
          <BarFill ratio={d.value / max} index={i} color={d.highlight ? colors.coin : active === i ? colors.primary : colors.primarySoft} maxHeight={height - 44} />
          <Text variant="caption" tone="soft" numberOfLines={1}>
            {d.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function BarFill({ ratio, index, color, maxHeight }: { ratio: number; index: number; color: string; maxHeight: number }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 55, withSpring(Math.max(ratio, 0.02) * maxHeight, { damping: 14, stiffness: 120 }));
  }, [h, index, maxHeight, ratio]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[{ width: '100%', maxWidth: 42, borderRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: color }, style]} />;
}
