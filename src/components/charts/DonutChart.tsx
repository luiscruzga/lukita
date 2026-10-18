import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

const ACircle = Animated.createAnimatedComponent(Circle);

export interface Slice {
  label: string;
  value: number;
}

/** Dona animada con leyenda. Los colores salen de la paleta categórica del tema, en orden. */
export function DonutChart({ data, size = 180, centerLabel, centerValue, format = (n: number) => String(n) }: { data: Slice[]; size?: number; centerLabel?: string; centerValue?: string; format?: (n: number) => string }) {
  const { colors, chart } = useTheme();
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const stroke = size * 0.14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [data, p]);
  let acc = 0;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((d, i) => {
              const frac = d.value / total;
              const start = acc;
              acc += frac;
              return <Arc key={d.label} c={c} r={r} size={size} stroke={stroke} color={chart[i % chart.length]} start={start} frac={frac} progress={p} />;
            })}
          </G>
        </Svg>
        <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          {centerValue ? <Text variant="h3">{centerValue}</Text> : null}
          {centerLabel ? (
            <Text variant="caption" tone="soft">
              {centerLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ gap: 8, flex: 1, minWidth: 140 }}>
        {data.map((d, i) => (
          <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: chart[i % chart.length] }} />
            <Text variant="small" style={{ flex: 1 }} numberOfLines={1}>
              {d.label}
            </Text>
            <Text variant="smallStrong">{format(d.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Arc({ c, r, size, stroke, color, start, frac, progress }: { c: number; r: number; size: number; stroke: number; color: string; start: number; frac: number; progress: { value: number } }) {
  const gap = frac > 0.02 ? 0.006 : 0;
  const props = useAnimatedProps(() => {
    const len = Math.max(0, (frac - gap) * c * progress.value);
    return { strokeDasharray: [len, c], strokeDashoffset: -start * c * progress.value };
  });
  return <ACircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="butt" animatedProps={props} />;
}
