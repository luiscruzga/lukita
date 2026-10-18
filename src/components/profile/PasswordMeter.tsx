import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';

export function passwordScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(4, s);
}

export function PasswordMeter({ password }: { password: string }) {
  const { colors } = useTheme();
  const score = passwordScore(password);
  const label = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][score];
  const color = [colors.coral, colors.coral, colors.coin, colors.mint, colors.mint][score];
  const bar = useAnimatedStyle(() => ({ width: withTiming(`${(score / 4) * 100}%`, { duration: 250 }), backgroundColor: color }));
  if (!password) return null;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 3 }, bar]} />
      </View>
      <Text variant="caption" tone="soft">
        Seguridad: {label}
      </Text>
    </View>
  );
}
