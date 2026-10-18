import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Pressable } from './Pressable';
import { Text } from './Text';

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = w / options.length;
  const pill = useAnimatedStyle(() => ({ width: seg - 6, transform: [{ translateX: withSpring(idx * seg, { damping: 20, stiffness: 240 }) }] }));
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 3, position: 'relative' }}
    >
      {w > 0 ? <Animated.View style={[{ position: 'absolute', top: 3, bottom: 3, left: 3, borderRadius: radius.sm, backgroundColor: colors.surface }, pill]} /> : null}
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
          onPress={() => onChange(o.value)}
          pressScale={0.96}
          style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="smallStrong" tone={o.value === value ? 'ink' : 'soft'}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
