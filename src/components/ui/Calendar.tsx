import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { MONTHS, monthMatrix, parseISODate, sameDay, toISODate } from '@/lib/dates';
import { IconButton } from './Button';
import { Pressable } from './Pressable';
import { Text } from './Text';

const HEAD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  value?: string | null;
  onChange?: (iso: string) => void;
  /** Rango seleccionado opcional (para pintar). */
  rangeEnd?: string | null;
  min?: string;
  max?: string;
  /** Intensidad 0..1 por día (calendario de calor de descuentos). */
  heat?: Record<string, number>;
  /** Etiqueta pequeña por día (p.ej. número de descuentos). */
  marks?: Record<string, string | number>;
  onMonthChange?: (year: number, month: number) => void;
  initialMonth?: { year: number; month: number };
  cellSize?: number;
}

/** Calendario propio (sin date pickers nativos) usado por DatePicker y por la vista Calendario. */
export function Calendar({ value, onChange, rangeEnd, min, max, heat, marks, onMonthChange, initialMonth, cellSize = 42 }: Props) {
  const { colors } = useTheme();
  const sel = parseISODate(value);
  const end = parseISODate(rangeEnd);
  const [cursor, setCursor] = useState(() => initialMonth ?? { year: (sel ?? new Date()).getFullYear(), month: (sel ?? new Date()).getMonth() });
  const [dir, setDir] = useState<1 | -1>(1);
  const weeks = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const today = new Date();
  const minD = parseISODate(min);
  const maxD = parseISODate(max);

  const move = (delta: 1 | -1) => {
    setDir(delta);
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      const next = { year: d.getFullYear(), month: d.getMonth() };
      onMonthChange?.(next.year, next.month);
      return next;
    });
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon={ChevronLeft} label="Mes anterior" onPress={() => move(-1)} size={36} />
        <Animated.View key={`${cursor.year}-${cursor.month}`} entering={FadeIn.duration(200)}>
          <Text variant="title" style={{ textTransform: 'capitalize' }}>
            {MONTHS[cursor.month]} {cursor.year}
          </Text>
        </Animated.View>
        <IconButton icon={ChevronRight} label="Mes siguiente" onPress={() => move(1)} size={36} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {HEAD.map((h, i) => (
          <Text key={i} variant="caption" tone={i >= 5 ? 'primary' : 'muted'} align="center" style={{ flex: 1 }}>
            {h}
          </Text>
        ))}
      </View>
      <Animated.View key={`${cursor.year}-${cursor.month}-grid`} entering={(dir > 0 ? SlideInRight : SlideInLeft).duration(240)} style={{ gap: 4 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row', gap: 4 }}>
            {week.map((d) => {
              const iso = toISODate(d);
              const inMonth = d.getMonth() === cursor.month;
              const disabled = (minD && d < minD) || (maxD && d > maxD);
              const isSel = (sel && sameDay(d, sel)) || (end && sameDay(d, end));
              const inRange = sel && end && d > sel && d < end;
              const isToday = sameDay(d, today);
              const h = heat?.[iso] ?? 0;
              const bg = isSel ? colors.primary : inRange ? colors.primarySoft : h > 0 ? withAlpha(colors.coin, 0.18 + h * 0.7) : 'transparent';
              return (
                <Pressable
                  key={iso}
                  disabled={!!disabled || !onChange}
                  onPress={() => onChange?.(iso)}
                  pressScale={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={iso}
                  accessibilityState={{ selected: !!isSel, disabled: !!disabled }}
                  style={{ flex: 1, height: cellSize, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderWidth: isToday && !isSel ? 1.5 : 0, borderColor: colors.primary, opacity: disabled ? 0.3 : inMonth ? 1 : 0.35 }}
                >
                  <Text variant="smallStrong" style={{ color: isSel ? colors.onPrimary : colors.ink }}>
                    {d.getDate()}
                  </Text>
                  {marks?.[iso] !== undefined && inMonth ? (
                    <Text variant="caption" style={{ fontSize: 9, lineHeight: 11, color: isSel ? colors.onPrimary : colors.inkSoft }}>
                      {marks[iso]}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export function withAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}
