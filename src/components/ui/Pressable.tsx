import { forwardRef, type ComponentRef } from 'react';
import { Pressable as RNPressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const APressable = Animated.createAnimatedComponent(RNPressable);

export interface PressProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Escala al presionar (1 = sin efecto). */
  pressScale?: number;
  haptic?: boolean;
}

/** Pressable con respuesta física (escala con muelle) y háptica opcional en nativo. */
export const Pressable = forwardRef<ComponentRef<typeof RNPressable>, PressProps>(function Pressable(
  { style, pressScale = 0.97, haptic = false, onPressIn, onPressOut, onPress, disabled, ...rest },
  ref,
) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      ref={ref}
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={(e) => {
        s.value = withSpring(pressScale, { damping: 20, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
        onPress?.(e);
      }}
      style={[style, anim, Platform.OS === 'web' ? ({ cursor: disabled ? 'not-allowed' : 'pointer' } as ViewStyle) : null]}
    />
  );
});
