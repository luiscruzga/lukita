import { useState } from 'react';
import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Grid2x2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { ADMIN_NAV, MAIN_NAV, TAB_NAV, type NavItem } from '@/constants/nav';
import { useRole } from '@/hooks/useRole';
import { Modal } from '../ui/Modal';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

/** Barra inferior flotante (teléfono). Respeta la barra de navegación del sistema. */
export function TabBar({ unread = 0 }: { unread?: number }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const { is } = useRole();
  const [more, setMore] = useState(false);
  const tabs = TAB_NAV.map((h) => MAIN_NAV.find((n) => n.href === h)!).filter(Boolean);
  const rest = [...MAIN_NAV.filter((n) => !TAB_NAV.includes(n.href)), ...ADMIN_NAV.filter((n) => !n.roles || is(...n.roles))];
  const restActive = !tabs.some((t) => path === t.href || path.startsWith(`${t.href}/`));

  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: 14 }}>
        <View style={[{ borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }, elevation(colors, 3)]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={{ flexDirection: 'row', padding: 6, backgroundColor: isDark ? 'rgba(25,23,63,0.82)' : 'rgba(255,255,255,0.86)' }}>
            {tabs.map((t) => (
              <Tab key={t.href} item={t} active={path === t.href || path.startsWith(`${t.href}/`)} onPress={() => router.push(t.href as never)} />
            ))}
            <Tab item={{ href: '#', label: 'Más', icon: Grid2x2 }} active={restActive} onPress={() => setMore(true)} dot={unread > 0} />
          </BlurView>
        </View>
      </View>
      <Modal visible={more} onClose={() => setMore(false)} title="Más opciones">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {rest.map((n) => {
            const Icon = n.icon;
            const active = path === n.href;
            return (
              <Pressable
                key={n.href}
                onPress={() => {
                  setMore(false);
                  router.push(n.href as never);
                }}
                style={{ width: '31%', flexGrow: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.lg, backgroundColor: active ? colors.primary : colors.surfaceAlt }}
              >
                <Icon size={22} color={active ? colors.onPrimary : colors.ink} />
                <Text variant="caption" style={{ color: active ? colors.onPrimary : colors.ink }} align="center">
                  {n.label}
                </Text>
                {n.href === '/notificaciones' && unread > 0 ? <View style={{ position: 'absolute', top: 10, right: 16, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' }}><Text variant="caption" style={{ color: '#fff', fontSize: 10 }}>{unread}</Text></View> : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

function Tab({ item, active, onPress, dot }: { item: NavItem; active: boolean; onPress: () => void; dot?: boolean }) {
  const { colors } = useTheme();
  const Icon = item.icon;
  const pill = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(active ? 1 : 0.6, { damping: 14 }) }], opacity: withSpring(active ? 1 : 0) }));
  return (
    <Pressable onPress={onPress} haptic pressScale={0.9} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={item.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 56, gap: 2 }}>
      <Animated.View style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, right: 4, borderRadius: radius.lg, backgroundColor: colors.primarySoft }, pill]} />
      <View>
        <Icon size={22} color={active ? colors.primary : colors.inkSoft} strokeWidth={active ? 2.5 : 2} />
        {dot ? <View style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral }} /> : null}
      </View>
      <Text variant="caption" style={{ fontSize: 11, color: active ? colors.primary : colors.inkSoft }}>
        {item.label}
      </Text>
    </Pressable>
  );
}
