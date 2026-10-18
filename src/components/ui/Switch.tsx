import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Pressable } from './Pressable';
import { Text } from './Text';

export function Switch({ value, onChange, label, description, disabled }: { value: boolean; onChange: (v: boolean) => void; label?: string; description?: string; disabled?: boolean }) {
  const { colors } = useTheme();
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 260 });
  }, [p, value]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.lineStrong, colors.primary]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 20 }, { scale: 1 + Math.sin(p.value * Math.PI) * 0.12 }] }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!value)}
      haptic
      pressScale={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: disabled ? 0.5 : 1 }}
    >
      {label ? (
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{label}</Text>
          {description ? (
            <Text variant="small" tone="soft">
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Animated.View style={[{ width: 48, height: 28, borderRadius: 14, padding: 3 }, track]}>
        <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }, knob]} />
      </Animated.View>
    </Pressable>
  );
}
