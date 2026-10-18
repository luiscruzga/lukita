import { useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

const APath = Animated.createAnimatedComponent(Path);

export interface SeriesPoint {
  label: string;
  value: number;
}

/** Curva suave (Catmull-Rom → Bézier). */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Área con gradiente que se dibuja al montar; toca un punto para ver su valor. */
export function AreaChart({ data, height = 200, color, format = (n: number) => String(n) }: { data: SeriesPoint[]; height?: number; color?: string; format?: (n: number) => string }) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const draw = useSharedValue(0);
  const pad = { l: 8, r: 8, t: 16, b: 26 };

  const { line, area, pts, max } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const iw = Math.max(1, w - pad.l - pad.r);
    const ih = height - pad.t - pad.b;
    const pts = data.map((d, i) => [pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw), pad.t + ih - (d.value / max) * ih] as [number, number]);
    const line = smooth(pts);
    const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih} Z` : '';
    return { line, area, pts, max };
  }, [data, w, height]);

  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [data, w, draw]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: 2000 * (1 - draw.value) }));
  const areaProps = useAnimatedProps(() => ({ fillOpacity: draw.value }));
  const gid = `g-${stroke.replace('#', '')}`;

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.35} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + (height - pad.t - pad.b) * f} y2={pad.t + (height - pad.t - pad.b) * f} stroke={colors.line} strokeDasharray="3 5" />
          ))}
          <APath d={area} fill={`url(#${gid})`} animatedProps={areaProps} />
          <APath d={line} stroke={stroke} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="2000" animatedProps={lineProps} />
          {pts.map((p, i) => (
            <SvgText key={`l${i}`} x={p[0]} y={height - 6} fontSize={11} fill={colors.inkMuted} textAnchor="middle" fontFamily={fonts.bodyMedium}>
              {data[i].label}
            </SvgText>
          ))}
          {active !== null && pts[active] ? (
            <>
              <Line x1={pts[active][0]} x2={pts[active][0]} y1={pad.t} y2={height - pad.b} stroke={stroke} strokeOpacity={0.4} />
              <Circle cx={pts[active][0]} cy={pts[active][1]} r={6} fill={colors.surface} stroke={stroke} strokeWidth={3} />
            </>
          ) : null}
        </Svg>
      ) : null}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row' }}>
        {data.map((d, i) => (
          <Pressable key={i} pressScale={1} style={{ flex: 1 }} onPress={() => setActive(active === i ? null : i)} accessibilityLabel={`${d.label}: ${format(d.value)}`} />
        ))}
      </View>
      {active !== null && pts[active] ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: Math.min(Math.max(pts[active][0] - 50, 0), w - 100), top: Math.max(pts[active][1] - 44, 0), width: 100, alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.ink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text variant="caption" style={{ color: colors.bg }}>
              {format(data[active].value)}
            </Text>
          </View>
        </View>
      ) : null}
      {max <= 1 && data.every((d) => d.value === 0) ? null : null}
    </View>
  );
}
