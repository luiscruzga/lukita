import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { type, type TypeVariant, type Colors } from '@/theme/tokens';

export type TextTone = 'ink' | 'soft' | 'muted' | 'primary' | 'coin' | 'mint' | 'coral' | 'onPrimary' | 'inherit';

interface Props extends TextProps {
  variant?: TypeVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  weight?: 'regular' | 'medium' | 'semi' | 'bold';
}

const toneColor = (c: Colors, tone: TextTone) =>
  ({
    ink: c.ink,
    soft: c.inkSoft,
    muted: c.inkMuted,
    primary: c.primary,
    coin: c.coin,
    mint: c.mint,
    coral: c.coral,
    onPrimary: c.onPrimary,
    inherit: undefined,
  })[tone];

const weightFamily = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semi: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
};

export function Text({ variant = 'body', tone = 'ink', align, weight, style, ...rest }: Props) {
  const { colors } = useTheme();
  const isDisplay = ['hero', 'h1', 'h2', 'h3', 'title', 'number'].includes(variant);
  return (
    <RNText
      {...rest}
      style={[
        type[variant],
        { color: toneColor(colors, tone), textAlign: align },
        weight && !isDisplay ? { fontFamily: weightFamily[weight] } : null,
        style,
      ]}
    />
  );
}
