import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** Semana compacta L-D con los días válidos rellenos y hoy subrayado. */
export function DayDots({ days, size = 18 }: { days: number[] | null; size?: number }) {
  const { colors } = useTheme();
  const today = new Date().getDay();
  const all = !days || days.length === 0;
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={all ? 'Todos los días' : `Días: ${days?.join(', ')}`}>
      {ORDER.map((d) => {
        const on = all || days!.includes(d);
        return (
          <View key={d} style={{ width: size, height: size, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? (d === today ? colors.coin : colors.primarySoft) : 'transparent', borderWidth: d === today ? 1.5 : 0, borderColor: d === today ? colors.ink : 'transparent' }}>
            <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.7, fontFamily: 'InstrumentSans_700Bold', color: on ? (d === today ? colors.onCoin : colors.primary) : colors.inkMuted }}>{LETTER[d]}</Text>
          </View>
        );
      })}
    </View>
  );
}
