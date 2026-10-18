import { useEffect } from 'react';
import { type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Pressable } from '../ui/Pressable';

/** Botón sol/luna: pasa la posición del toque para que la transición circular nazca desde aquí. */
export function ThemeToggle({ size = 40 }: { size?: number }) {
  const { isDark, toggleTheme, colors } = useTheme();
  const r = useSharedValue(isDark ? 1 : 0);
  useEffect(() => {
    r.value = withSpring(isDark ? 1 : 0, { damping: 12, stiffness: 140 });
  }, [isDark, r]);
  const sun = useAnimatedStyle(() => ({ position: 'absolute', opacity: 1 - r.value, transform: [{ rotate: `${r.value * 180}deg` }, { scale: 1 - r.value * 0.5 }] }));
  const moon = useAnimatedStyle(() => ({ position: 'absolute', opacity: r.value, transform: [{ rotate: `${(r.value - 1) * 180}deg` }, { scale: 0.5 + r.value * 0.5 }] }));
  const onPress = (e: GestureResponderEvent) => toggleTheme({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
  return (
    <Pressable
      onPress={onPress}
      haptic
      pressScale={0.88}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={sun}>
        <Sun size={size * 0.5} color={colors.ink} />
      </Animated.View>
      <Animated.View style={moon}>
        <Moon size={size * 0.48} color={colors.coin} />
      </Animated.View>
    </Pressable>
  );
}
