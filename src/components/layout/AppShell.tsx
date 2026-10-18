import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bell } from 'lucide-react-native';
import { useUser } from '@/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAppStore } from '@/stores/useAppStore';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useNotifications } from '@/hooks/queries';
import { getLastKnown, getPermissionStatus, requestCurrentPosition } from '@/services/location';
import { addNotificationListeners } from '@/services/notifications';
import { useNearbyAlerts } from '@/hooks/useNearbyAlerts';
import { Logo } from '../brand/Logo';
import { Avatar } from '../ui/Avatar';
import { Pressable } from '../ui/Pressable';
import { useToast } from '../ui/Toast';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { ThemeToggle } from './ThemeToggle';
import { UpdatePrompt } from './UpdatePrompt';
import { ApiStatusBanner } from './ApiStatusBanner';

/**
 * Estructura de la app autenticada: barra superior (respeta la barra de estado), barra lateral
 * colapsable en tablet/escritorio y barra inferior en teléfono.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoint();
  const { user } = useUser();
  const toast = useToast();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const setLocation = useAppStore((s) => s.setLocation);
  const notifications = useNotifications();
  const unread = notifications.data?.pages[0]?.unread ?? 0;
  useNearbyAlerts();

  useEffect(() => {
    storage.get<boolean>(STORAGE_KEYS.sidebarCollapsed, false).then(setCollapsed);
    (async () => {
      const last = await getLastKnown();
      const status = await getPermissionStatus();
      if (last) setLocation(last, status);
      if (status === 'granted') {
        const r = await requestCurrentPosition();
        setLocation(r.coords ?? last, r.status);
      } else setLocation(last, status);
    })();
  }, [setCollapsed, setLocation]);

  useEffect(
    () =>
      addNotificationListeners(
        (n) => {
          toast.show({ kind: 'notification', title: n.title, message: n.body, onPress: () => n.data?.discountId && router.push(`/descuento/${n.data.discountId}` as never) });
          notifications.refetch();
        },
        (data) => {
          if (typeof data.discountId === 'string') router.push(`/descuento/${data.discountId}` as never);
          else if (typeof data.url === 'string') router.push(data.url as never);
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggle = () => {
    setCollapsed(!collapsed);
    storage.set(STORAGE_KEYS.sidebarCollapsed, !collapsed);
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!isPhone ? <Sidebar collapsed={collapsed} onToggle={toggle} unread={unread} /> : null}
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: insets.top, backgroundColor: colors.bg }}>
          <View style={{ height: isPhone ? 60 : 68, flexDirection: 'row', alignItems: 'center', justifyContent: isPhone ? 'space-between' : 'flex-end', paddingHorizontal: isPhone ? 16 : 28, gap: 10 }}>
            {isPhone ? (
              <Pressable onPress={() => router.push('/hoy')} accessibilityLabel="Ir a Hoy">
                <Logo size={32} />
              </Pressable>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ThemeToggle />
              <Pressable onPress={() => router.push('/notificaciones')} accessibilityLabel={`Alertas${unread ? `, ${unread} sin leer` : ''}`} pressScale={0.9} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} color={colors.ink} />
                {unread > 0 ? <View style={{ position: 'absolute', top: 8, right: 9, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral, borderWidth: 2, borderColor: colors.surfaceAlt }} /> : null}
              </Pressable>
              <Pressable onPress={() => router.push('/perfil')} accessibilityLabel="Perfil" pressScale={0.9}>
                <Avatar uri={user?.imageUrl} name={user?.fullName ?? user?.username} size={40} />
              </Pressable>
            </View>
          </View>
        </View>
        <ApiStatusBanner />
        <View style={{ flex: 1 }}>{children}</View>
        {isPhone ? <TabBar unread={unread} /> : null}
      </View>
      <UpdatePrompt />
    </View>
  );
}
