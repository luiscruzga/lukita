import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

/**
 * Marca de Lukita: una etiqueta de precio añil asomando tras una "luka" dorada con la L.
 * El mismo dibujo se usa para el ícono del APK y los favicons (ver assets/brand/*.svg).
 */
export function LogoMark({ size = 40, mono }: { size?: number; mono?: boolean }) {
  const { colors } = useTheme();
  const tag = mono ? colors.ink : colors.primary;
  const coin = mono ? colors.ink : '#FFB81C';
  const ink = mono ? colors.bg : '#16133F';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Lukita">
      <G transform="rotate(-18 32 32)">
        <Path d="M20 6 H50 a6 6 0 0 1 6 6 V40 a6 6 0 0 1 -6 6 H20 L8 26 Z" fill={tag} />
        <Circle cx="20" cy="26" r="3.6" fill={mono ? colors.bg : '#F4F5FB'} />
      </G>
      <Circle cx="38" cy="38" r="21" fill={coin} />
      <Circle cx="38" cy="38" r="16.5" fill="none" stroke={ink} strokeOpacity={0.2} strokeWidth="1.6" strokeDasharray="2.2 3.2" />
      <Path d="M32 28 V47 H45" stroke={ink} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="45.5" cy="30" r="2.8" fill={ink} />
    </Svg>
  );
}

/** Logotipo: "lukita" en Bricolage ExtraBold con el punto de la i convertido en moneda. */
export function Wordmark({ size = 28, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.ink;
  const style = { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: size, lineHeight: size * 1.1, letterSpacing: -size * 0.045, color: c };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} accessibilityRole="header" accessibilityLabel="Lukita">
      <Text style={style}>luk</Text>
      <View>
        <Text style={style}>ı</Text>
        <View style={{ position: 'absolute', top: size * 0.02, left: '50%', marginLeft: -size * 0.13, width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13, backgroundColor: colors.coin, borderWidth: Math.max(1, size * 0.035), borderColor: c }} />
      </View>
      <Text style={style}>ta</Text>
    </View>
  );
}

export function Logo({ size = 36, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.28 }}>
      <LogoMark size={size} />
      {showName ? <Wordmark size={size * 0.78} /> : null}
    </View>
  );
}
