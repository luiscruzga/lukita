import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth';
import { LukitaLoader } from '@/components/brand/LukitaLoader';
import { AppShell } from '@/components/layout/AppShell';
import { useMe } from '@/hooks/queries';

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  // GET /v1/me crea/sincroniza el perfil en Supabase la primera vez.
  useMe(!!isSignedIn);
  if (!isLoaded) return <LukitaLoader fullscreen />;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }} />
    </AppShell>
  );
}
