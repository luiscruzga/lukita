import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { NavigationTheme } from '@/theme/NavigationTheme';
import { ToastProvider } from '@/components/ui/Toast';
import { DialogProvider } from '@/components/ui/DialogProvider';
import { ApiAuthBridge } from '@/components/layout/ApiAuthBridge';
import { LukitaLoader } from '@/components/brand/LukitaLoader';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/lib/api';
import { env } from '@/lib/env';
import { isDevAuth } from '@/auth';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
            refetchOnWindowFocus: Platform.OS === 'web',
          },
        },
      }),
  );

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider>
            {!fontsLoaded ? (
              <LukitaLoader fullscreen label={null} />
            ) : !env.clerkKey && !isDevAuth ? (
              <MissingConfig />
            ) : (
              <MaybeClerk>
                <QueryClientProvider client={queryClient}>
                  <ToastProvider>
                    <DialogProvider>
                      <ApiAuthBridge />
                      <NavigationTheme>
                        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
                      </NavigationTheme>
                    </DialogProvider>
                  </ToastProvider>
                </QueryClientProvider>
              </MaybeClerk>
            )}
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** En modo local (sin publishable key, en desarrollo) no se monta Clerk. */
function MaybeClerk({ children }: { children: React.ReactNode }) {
  if (isDevAuth) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={env.clerkKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}

function MissingConfig() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
      <Text variant="h2" align="center">
        Falta configurar Clerk
      </Text>
      <Text tone="soft" align="center" style={{ maxWidth: 420 }}>
        Copia apps/mobile/.env.example a .env y define EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Luego reinicia Expo.
      </Text>
    </View>
  );
}
