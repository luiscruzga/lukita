import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, type PressProps } from './Pressable';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Variant = 'primary' | 'coin' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Button({ label, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, fullWidth, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();
  const look = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    coin: { bg: colors.coin, fg: colors.onCoin, border: colors.coin },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.lineStrong },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.coral, fg: '#FFFFFF', border: colors.coral },
  }[variant];
  const dims = { sm: { h: 36, px: 14, icon: 16 }, md: { h: 46, px: 18, icon: 18 }, lg: { h: 56, px: 24, icon: 20 } }[size];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      haptic
      disabled={off}
      {...rest}
      style={[
        styles.base,
        {
          height: dims.h,
          paddingHorizontal: dims.px,
          backgroundColor: look.bg,
          borderColor: look.border,
          opacity: off ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={dims.icon} color={look.fg} strokeWidth={2.2} /> : null}
          <Text variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} style={{ color: look.fg }}>
            {label}
          </Text>
          {IconRight ? <IconRight size={dims.icon} color={look.fg} strokeWidth={2.2} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  tone = 'default',
  size = 40,
  style,
  ...rest
}: { icon: LucideIcon; label: string; tone?: 'default' | 'primary' | 'ghost'; size?: number } & Omit<PressProps, 'children'>) {
  const { colors } = useTheme();
  const bg = tone === 'primary' ? colors.primary : tone === 'ghost' ? 'transparent' : colors.surfaceAlt;
  const fg = tone === 'primary' ? colors.onPrimary : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      pressScale={0.9}
      {...rest}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Icon size={Math.round(size * 0.48)} color={fg} strokeWidth={2.1} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
