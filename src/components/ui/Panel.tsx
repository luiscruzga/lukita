import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { Text } from './Text';

/** Superficie contenedora. `tone="sunken"` para agrupar controles, `raised` para destacar. */
export function Panel({ children, title, action, tone = 'flat', style, padded = true }: { children: ReactNode; title?: string; action?: ReactNode; tone?: 'flat' | 'raised' | 'sunken' | 'ink'; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { colors } = useTheme();
  const bg = { flat: colors.surface, raised: colors.surface, sunken: colors.surfaceAlt, ink: colors.primary }[tone];
  return (
    <View style={[{ backgroundColor: bg, borderRadius: radius.lg, padding: padded ? 18 : 0, gap: 14, borderWidth: tone === 'flat' ? 1 : 0, borderColor: colors.line }, tone === 'raised' && elevation(colors, 2), style]}>
      {title || action ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: padded ? 0 : 18, paddingTop: padded ? 0 : 18 }}>
          {title ? (
            <Text variant="title" tone={tone === 'ink' ? 'onPrimary' : 'ink'}>
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h3">{title}</Text>
        {subtitle ? (
          <Text variant="small" tone="soft">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
