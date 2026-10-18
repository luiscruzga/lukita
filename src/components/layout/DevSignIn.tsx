import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FlaskConical, LogIn } from 'lucide-react-native';
import { AuthFrame } from './AuthFrame';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Pressable } from '../ui/Pressable';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Chip';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { DEV_PRESETS, useDevStore } from '@/auth/devStore';
import { ROLE_LABEL } from '@/constants/categories';
import type { Role } from '@/types/domain';

const ROLES: Role[] = ['admin', 'moderator', 'partner', 'user'];

/**
 * Pantalla de acceso del modo local (sin Clerk). Solo existe en desarrollo: deja entrar con un
 * usuario de prueba de cada rol para revisar la app. La API debe correr con DEV_AUTH=true.
 */
export function DevSignIn() {
  const { colors } = useTheme();
  const signIn = useDevStore((s) => s.signIn);
  const [role, setRole] = useState<Role>('admin');
  const preset = DEV_PRESETS[role];
  return (
    <AuthFrame title="Modo local" subtitle="Clerk no está configurado. Entra con un usuario de prueba para revisar la app.">
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: radius.lg, backgroundColor: colors.coinSoft }}>
        <FlaskConical size={20} color={colors.ink} />
        <Text variant="small" style={{ flex: 1 }}>
          Solo funciona en desarrollo y contra una API con <Text variant="smallStrong">DEV_AUTH=true</Text>. Para usar cuentas reales define EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        {ROLES.map((r) => {
          const p = DEV_PRESETS[r];
          const on = r === role;
          return (
            <Pressable key={r} onPress={() => setRole(r)} accessibilityRole="radio" accessibilityState={{ checked: on }} pressScale={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? colors.primary : colors.line, backgroundColor: colors.surface }}>
              <Avatar uri={p.imageUrl} name={p.firstName} size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {p.firstName} {p.lastName}
                </Text>
                <Text variant="caption" tone="soft">
                  {r}@lukita.local
                </Text>
              </View>
              <Badge label={ROLE_LABEL[r]} tone={on ? 'primary' : 'neutral'} />
            </Pressable>
          );
        })}
      </View>
      <Button
        size="lg"
        fullWidth
        icon={LogIn}
        label={`Entrar como ${preset.firstName}`}
        onPress={async () => {
          await signIn(preset);
          router.replace('/hoy');
        }}
      />
    </AuthFrame>
  );
}
