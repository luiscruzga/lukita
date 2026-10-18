import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { radius as R } from '@/theme/tokens';

/** Reloj compartido: todos los skeletons brillan en fase, como una sola superficie. */
function useShimmer() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [t]);
  return t;
}

interface Props {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 14, radius = R.sm, style }: Props) {
  const { colors } = useTheme();
  const t = useShimmer();
  const [w, setW] = useState(200);
  const shine = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-w, w]) }],
  }));
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width || 200)}
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeletonBase, overflow: 'hidden' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, shine]}>
        <LinearGradient
          colors={['transparent', colors.skeletonShine, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Skeleton con forma de cupón (la tarjeta de descuento). */
export function TicketSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: R.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: 92, padding: 14, gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}>
        <Skeleton width={56} height={30} radius={8} />
        <Skeleton width={40} height={10} />
      </View>
      <View style={{ flex: 1, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Skeleton width={34} height={34} radius={17} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={10} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Skeleton width={46} height={22} radius={11} />
          <Skeleton width={46} height={22} radius={11} />
          <Skeleton width={64} height={22} radius={11} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <TicketSkeleton key={i} />
      ))}
    </View>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  const { colors } = useTheme();
  const bars = [0.45, 0.7, 0.55, 0.9, 0.62, 0.8, 0.5, 0.74];
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, backgroundColor: colors.surface, borderRadius: R.lg }}>
      {bars.map((b, i) => (
        <Skeleton key={i} width={undefined} height={`${b * 100}%`} radius={8} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <View style={{ gap: 10 }}>
      <Skeleton height={36} radius={10} />
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 12 }}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} height={18} style={{ flex: c === 0 ? 2 : 1 }} width={undefined} />
          ))}
        </View>
      ))}
    </View>
  );
}
