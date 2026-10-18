import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Pressable } from './Pressable';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  leading?: ReactNode;
  count?: number;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected, onPress, icon: Icon, leading, count, size = 'md' }: Props) {
  const { colors } = useTheme();
  const h = size === 'sm' ? 30 : 36;
  const fg = selected ? colors.onPrimary : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      pressScale={0.94}
      haptic
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, { height: h, paddingHorizontal: size === 'sm' ? 10 : 14, backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.line }]}
    >
      {leading}
      {Icon ? <Icon size={size === 'sm' ? 14 : 16} color={fg} /> : null}
      <Text variant={size === 'sm' ? 'caption' : 'smallStrong'} style={{ color: fg }}>
        {label}
      </Text>
      {count !== undefined ? (
        <View style={[styles.count, { backgroundColor: selected ? colors.coin : colors.surfaceAlt }]}>
          <Text variant="caption" style={{ color: selected ? colors.onCoin : colors.inkSoft }}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Etiqueta no interactiva con tono semántico. */
export function Badge({ label, tone = 'neutral', icon: Icon }: { label: string; tone?: 'neutral' | 'primary' | 'coin' | 'mint' | 'coral' | 'sky'; icon?: LucideIcon }) {
  const { colors } = useTheme();
  const map = {
    neutral: [colors.surfaceAlt, colors.inkSoft],
    primary: [colors.primarySoft, colors.primary],
    coin: [colors.coinSoft, colors.ink],
    mint: [colors.mintSoft, colors.mint],
    coral: [colors.coralSoft, colors.coral],
    sky: [colors.skySoft, colors.sky],
  } as Record<string, [string, string]>;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {Icon ? <Icon size={12} color={fg} strokeWidth={2.4} /> : null}
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1.5 },
  count: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
});
