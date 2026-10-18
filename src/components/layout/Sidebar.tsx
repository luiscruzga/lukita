import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { router, usePathname } from 'expo-router';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react-native';
import { useUser } from '@/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { ADMIN_NAV, MAIN_NAV, type NavItem } from '@/constants/nav';
import { useRole } from '@/hooks/useRole';
import { ROLE_LABEL } from '@/constants/categories';
import { Logo, LogoMark } from '../brand/Logo';
import { Avatar } from '../ui/Avatar';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

export const SIDEBAR_W = 256;
export const SIDEBAR_COLLAPSED_W = 84;

/** Barra lateral colapsable: expandida muestra logo + nombre; colapsada solo la marca e íconos. */
export function Sidebar({ collapsed, onToggle, unread = 0 }: { collapsed: boolean; onToggle: () => void; unread?: number }) {
  const { colors } = useTheme();
  const path = usePathname();
  const { is } = useRole();
  const { user } = useUser();
  const { role } = useRole();
  const width = useAnimatedStyle(() => ({ width: withSpring(collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W, { damping: 20, stiffness: 180 }) }));
  const admin = ADMIN_NAV.filter((n) => !n.roles || is(...n.roles));

  const item = (n: NavItem) => {
    const active = n.href === '/admin' ? path === '/admin' : path === n.href || path.startsWith(`${n.href}/`);
    const Icon = n.icon;
    return (
      <Pressable
        key={n.href}
        onPress={() => router.push(n.href as never)}
        pressScale={0.97}
        accessibilityRole="link"
        accessibilityLabel={n.label}
        accessibilityState={{ selected: active }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, paddingHorizontal: collapsed ? 0 : 14, justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: radius.md, backgroundColor: active ? colors.primary : 'transparent' }}
      >
        <View>
          <Icon size={20} color={active ? colors.onPrimary : colors.inkSoft} strokeWidth={active ? 2.4 : 2} />
          {n.href === '/notificaciones' && unread > 0 ? <View style={{ position: 'absolute', top: -3, right: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.coral, borderWidth: 2, borderColor: active ? colors.primary : colors.surface }} /> : null}
        </View>
        {!collapsed ? (
          <Text variant="smallStrong" style={{ color: active ? colors.onPrimary : colors.ink }} numberOfLines={1}>
            {n.label}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Animated.View style={[{ backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.line, height: '100%' }, width]}>
      <View style={{ height: 76, flexDirection: 'row', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', paddingHorizontal: collapsed ? 0 : 18 }}>
        <Pressable onPress={() => router.push('/hoy')} accessibilityLabel="Ir a Hoy" pressScale={0.95}>
          {collapsed ? <LogoMark size={40} /> : <Logo size={36} />}
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, gap: 4, paddingBottom: 16 }}>
        {MAIN_NAV.map(item)}
        {admin.length ? (
          <>
            <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 12 }} />
            {!collapsed ? (
              <Text variant="caption" tone="muted" style={{ paddingHorizontal: 14, marginBottom: 4 }}>
                Administración
              </Text>
            ) : null}
            {admin.map(item)}
          </>
        ) : null}
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.line, padding: 14, gap: 10 }}>
        {!collapsed && user ? (
          <Pressable onPress={() => router.push('/perfil')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityLabel="Abrir perfil">
            <Avatar uri={user.imageUrl} name={user.fullName ?? user.username} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="smallStrong" numberOfLines={1}>
                {user.fullName || user.username || user.email}
              </Text>
              <Text variant="caption" tone="muted">
                {ROLE_LABEL[role]}
              </Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', height: 38, paddingHorizontal: collapsed ? 0 : 10, borderRadius: radius.sm }}
        >
          <CollapseIcon collapsed={collapsed} color={colors.inkSoft} />
          {!collapsed ? (
            <Text variant="small" tone="soft">
              Colapsar
            </Text>
          ) : null}
        </Pressable>
      </View>
    </Animated.View>
  );
}

function CollapseIcon({ collapsed, color }: { collapsed: boolean; color: string }) {
  const s = useAnimatedStyle(() => ({ opacity: withTiming(1, { duration: 200 }) }));
  return <Animated.View style={s}>{collapsed ? <PanelLeftOpen size={20} color={color} /> : <PanelLeftClose size={20} color={color} />}</Animated.View>;
}
