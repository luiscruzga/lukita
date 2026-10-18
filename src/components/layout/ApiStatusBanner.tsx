import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { ApiError } from '@/lib/api';
import { env } from '@/lib/env';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';

/**
 * Banner cuando la API no responde (error de red). Útil sobre todo en desarrollo: deja claro que
 * falta levantar apps/api o que EXPO_PUBLIC_API_URL apunta mal, en vez de mostrar listas vacías.
 */
export function ApiStatusBanner() {
  const qc = useQueryClient();
  const { colors } = useTheme();
  const [down, setDown] = useState(false);
  useEffect(() => {
    const unsub = qc.getQueryCache().subscribe((e) => {
      if (e.type !== 'updated') return;
      const q = e.query;
      if (q.state.status === 'error') setDown(q.state.error instanceof ApiError && q.state.error.status === 0);
      else if (q.state.status === 'success') setDown(false);
    });
    return unsub;
  }, [qc]);
  if (!down) return null;
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={{ marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: radius.lg, backgroundColor: colors.coralSoft, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <CloudOff size={20} color={colors.coral} />
      <View style={{ flex: 1, minWidth: 200 }}>
        <Text variant="smallStrong" tone="coral">
          No se pudo conectar con la API
        </Text>
        <Text variant="caption" tone="soft">
          {env.apiUrl} no responde. Levanta apps/api (npm run dev) o revisa EXPO_PUBLIC_API_URL.
        </Text>
      </View>
      <Button size="sm" variant="secondary" icon={RefreshCw} label="Reintentar" onPress={() => qc.refetchQueries({ type: 'active' })} />
    </Animated.View>
  );
}
