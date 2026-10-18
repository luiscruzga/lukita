import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useRole } from '@/hooks/useRole';
import type { Role } from '@/types/domain';
import { Screen } from '../ui/Screen';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

/** Oculta pantallas según rol. Es solo UX: la API valida el rol en cada endpoint. */
export function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { is } = useRole();
  if (!is(...roles))
    return (
      <Screen topInset={false}>
        <EmptyState icon={ShieldAlert} title="No tienes acceso a esta sección" message="Si crees que es un error, pide a un administrador que revise tu rol." action={<Button label="Ir a Hoy" onPress={() => router.replace('/hoy')} />} />
      </Screen>
    );
  return <>{children}</>;
}
