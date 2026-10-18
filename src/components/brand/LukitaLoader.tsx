import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

/**
 * Loading propio de Lukita: una luka (moneda) que gira sobre su eje mientras tres etiquetas de
 * precio orbitan y caen sobre ella, con un brillo que recorre la moneda. Úsalo para cargas de
 * pantalla completa; para listas usa skeletons.
 */
export function LukitaLoader({ label = 'Buscando lukitas…', size = 112, fullscreen = false }: { label?: string | null; size?: number; fullscreen?: boolean }) {
  const { colors } = useTheme();
  const spin = useSharedValue(0);
  const orbit = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }), -1, false);
    orbit.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
    bounce.value = withRepeat(withSequence(withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) })), -1, false);
  }, [bounce, orbit, spin]);

  const coin = useAnimatedStyle(() => {
    const scaleX = Math.cos(spin.value * Math.PI * 2);
    return {
      transform: [{ translateY: interpolate(bounce.value, [0, 1], [0, -10]) }, { scaleX: Math.abs(scaleX) < 0.06 ? 0.06 : Math.abs(scaleX) }],
    };
  });
  const shadow = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(bounce.value, [0, 1], [1, 0.7]) }],
    opacity: interpolate(bounce.value, [0, 1], [0.28, 0.12]),
  }));

  return (
    <View style={[styles.wrap, fullscreen && [StyleSheet.absoluteFill, { backgroundColor: colors.bg }]]} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Cargando'}>
      <View style={{ width: size * 1.9, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <OrbitTag key={i} index={i} orbit={orbit} radius={size * 0.82} color={[colors.primary, colors.mint, colors.coral][i]} />
        ))}
        <Animated.View style={coin}>
          <Svg width={size} height={size} viewBox="0 0 120 120">
            <Circle cx="60" cy="60" r="56" fill={colors.coin} />
            <Circle cx="60" cy="60" r="46" fill="none" stroke={colors.onCoin} strokeOpacity={0.22} strokeWidth="3" strokeDasharray="4 6" />
            <Path d="M46 34 v42 h28" stroke={colors.onCoin} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx="78" cy="40" r="6" fill={colors.onCoin} />
          </Svg>
        </Animated.View>
        <Animated.View style={[{ width: size * 0.7, height: 10, borderRadius: 999, backgroundColor: colors.shadow, marginTop: 14 }, shadow]} />
      </View>
      {label ? <ShimmerLabel label={label} /> : null}
    </View>
  );
}

function OrbitTag({ index, orbit, radius, color }: { index: number; orbit: { value: number }; radius: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const a = (orbit.value + index / 3) * Math.PI * 2;
    const depth = Math.sin(a);
    return {
      position: 'absolute',
      opacity: interpolate(depth, [-1, 1], [0.35, 1]),
      zIndex: depth > 0 ? 2 : 0,
      transform: [{ translateX: Math.cos(a) * radius }, { translateY: depth * radius * 0.28 - 8 }, { rotate: `${Math.cos(a) * 24}deg` }, { scale: interpolate(depth, [-1, 1], [0.7, 1.05]) }],
    };
  });
  return (
    <Animated.View style={style}>
      <Svg width={34} height={22} viewBox="0 0 34 22">
        <Path d="M8 1 H31 a2 2 0 0 1 2 2 V19 a2 2 0 0 1 -2 2 H8 L1 11 Z" fill={color} />
        <Circle cx="9" cy="11" r="2.6" fill="#fff" />
      </Svg>
    </Animated.View>
  );
}

function ShimmerLabel({ label }: { label: string }) {
  const o = useSharedValue(0.4);
  useEffect(() => {
    o.value = withDelay(200, withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style}>
      <Text variant="title" tone="soft" align="center">
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center', gap: 4, padding: 24 } });
