import { ScrollView, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { addDays, toISODate, WEEKDAYS_SHORT } from '@/lib/dates';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

/** Próximos 14 días como fichas; la elegida se vuelve moneda dorada. */
export function WeekStrip({ value, onChange, counts }: { value: string; onChange: (iso: string) => void; counts?: Record<string, number> }) {
  const { colors } = useTheme();
  const start = new Date();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {Array.from({ length: 14 }, (_, i) => addDays(start, i)).map((d, i) => {
        const iso = toISODate(d);
        const on = iso === value;
        return (
          <Pressable
            key={iso}
            onPress={() => onChange(iso)}
            haptic
            pressScale={0.92}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={i === 0 ? 'Hoy' : iso}
            style={{ width: 58, paddingVertical: 10, borderRadius: radius.lg, alignItems: 'center', gap: 2, backgroundColor: on ? colors.coin : colors.surface, borderWidth: 1.5, borderColor: on ? colors.coin : colors.line }}
          >
            <Text variant="caption" style={{ color: on ? colors.onCoin : colors.inkSoft }}>
              {i === 0 ? 'Hoy' : WEEKDAYS_SHORT[d.getDay()]}
            </Text>
            <Text variant="h3" style={{ color: on ? colors.onCoin : colors.ink }}>
              {d.getDate()}
            </Text>
            <View style={{ height: 14, justifyContent: 'center' }}>
              {counts?.[iso] ? (
                <Text variant="caption" style={{ fontSize: 10, color: on ? colors.onCoin : colors.primary }}>
                  {counts[iso]}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
