import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export function Avatar({ uri, name, size = 40, ring }: { uri?: string | null; name?: string | null; size?: number; ring?: boolean }) {
  const { colors } = useTheme();
  const initials = (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.coin,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: ring ? 3 : 0,
        borderColor: colors.surface,
      }}
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar de ${name}` : 'Avatar'}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
      ) : (
        <Text style={{ color: colors.onCoin, fontSize: size * 0.38, fontFamily: 'BricolageGrotesque_800ExtraBold' }}>{initials}</Text>
      )}
    </View>
  );
}
