import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';
import { withAlpha } from '../ui/Calendar';

/** Mapa de calor filas × columnas (p. ej. día de la semana × categoría). */
export function Heatmap({ rows, cols, values, format = (n: number) => String(n) }: { rows: string[]; cols: string[]; values: number[][]; format?: (n: number) => string }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...values.flat());
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4, paddingLeft: 64 }}>
        {cols.map((c) => (
          <Text key={c} variant="caption" tone="muted" align="center" style={{ flex: 1, fontSize: 10 }} numberOfLines={1}>
            {c}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={r} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Text variant="caption" tone="soft" style={{ width: 60 }} numberOfLines={1}>
            {r}
          </Text>
          {cols.map((c, ci) => {
            const v = values[ri]?.[ci] ?? 0;
            const a = v / max;
            return (
              <View key={c} accessibilityLabel={`${r}, ${c}: ${format(v)}`} style={{ flex: 1, height: 28, borderRadius: 7, backgroundColor: v === 0 ? colors.surfaceAlt : withAlpha(colors.primary, 0.15 + a * 0.85), alignItems: 'center', justifyContent: 'center' }}>
                {a > 0.55 ? (
                  <Text variant="caption" style={{ color: colors.onPrimary, fontSize: 10 }}>
                    {format(v)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
