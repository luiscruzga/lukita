import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth';
import { LukitaLoader } from '@/components/brand/LukitaLoader';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LukitaLoader fullscreen />;
  if (isSignedIn) return <Redirect href="/hoy" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
