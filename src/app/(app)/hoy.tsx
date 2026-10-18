import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useUser } from '@/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, MapPin, PiggyBank, Wallet, Sparkles, Hourglass } from 'lucide-react-native';
import { useAccounts, useInfiniteDiscounts, useDiscounts, useSavingsStats, useCalendar } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatDate, parseISODate, todayISO, WEEKDAYS_LONG } from '@/lib/dates';
import { formatCLP } from '@/lib/format';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/Panel';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { WeekStrip } from '@/components/discounts/WeekStrip';
import { CategoryChips } from '@/components/discounts/CategoryChips';
import { TicketGrid } from '@/components/discounts/TicketGrid';
import { DiscountTicket } from '@/components/discounts/DiscountTicket';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Pressable } from '@/components/ui/Pressable';

export default function Hoy() {
  const { colors } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoint();
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState<string | null>(null);
  const accounts = useAccounts();
  const hasAccounts = (accounts.data?.length ?? 0) > 0;
  const filters = { mine: hasAccounts, date, category, sort: 'value' as const, pageSize: 18 };
  const list = useInfiniteDiscounts(filters, accounts.isFetched);
  const featured = useDiscounts({ mine: hasAccounts, featured: true, pageSize: 8 }, 1, accounts.isFetched);
  const ending = useDiscounts({ mine: hasAccounts, sort: 'ending', pageSize: 6 }, 1, accounts.isFetched);
  const stats = useSavingsStats();
  const month = date.slice(0, 7);
  const calendar = useCalendar(month, hasAccounts);
  const counts = useMemo(() => Object.fromEntries((calendar.data ?? []).map((d) => [d.date, d.count])), [calendar.data]);
  const items = list.data?.pages.flatMap((p) => p.data) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const d = parseISODate(date)!;
  const isToday = date === todayISO();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [-100, 0, 200], [-30, 0, 60], Extrapolation.CLAMP) }, { scale: interpolate(scrollY.value, [-100, 0], [1.05, 1], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 220], [1, 0.35], Extrapolation.CLAMP),
  }));
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${scrollY.value * 0.4}deg` }, { translateY: scrollY.value * -0.25 }] }));

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: isPhone ? 16 : 28, paddingBottom: insets.bottom + 110, gap: 18, maxWidth: 1280, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.primary} />}
    >
      <Animated.View style={heroStyle}>
        <View style={{ backgroundColor: colors.primary, borderRadius: radius.xl, padding: isPhone ? 20 : 28, overflow: 'hidden', gap: 14 }}>
          <Animated.View style={[{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.coin, opacity: 0.95 }, coinStyle]}>
            <View style={{ position: 'absolute', left: 58, top: 62, width: 26, height: 72, borderRadius: 8, backgroundColor: colors.onCoin, opacity: 0.18 }} />
            <View style={{ position: 'absolute', left: 58, top: 112, width: 70, height: 22, borderRadius: 8, backgroundColor: colors.onCoin, opacity: 0.18 }} />
          </Animated.View>
          <Text variant="bodyStrong" style={{ color: colors.onPrimary, opacity: 0.85 }}>
            Hola{user?.firstName ? `, ${user.firstName}` : ''} · {isToday ? 'hoy es' : 'para el'} {WEEKDAYS_LONG[d.getDay()]} {formatDate(date, { withYear: false })}
          </Text>
          {list.isLoading ? (
            <Skeleton width={220} height={52} radius={12} />
          ) : (
            <Text variant="hero" style={{ color: colors.onPrimary, fontSize: isPhone ? 44 : 60, lineHeight: isPhone ? 48 : 64, maxWidth: 560 }}>
              {total} {total === 1 ? 'descuento' : 'descuentos'}
            </Text>
          )}
          <Text style={{ color: colors.onPrimary, opacity: 0.85, maxWidth: 520 }}>
            {hasAccounts ? `con tus ${accounts.data!.length} cuentas${isToday ? ' para usar hoy' : ''}.` : 'en todo Chile. Agrega tus cuentas para ver solo los tuyos.'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            <HeroStat icon={PiggyBank} label="Ahorrado este mes" value={stats.data ? formatCLP(stats.data.month_saved) : '…'} onPress={() => router.push('/ahorro')} />
            <HeroStat icon={MapPin} label="Ver cerca de ti" value="Mapa" onPress={() => router.push('/mapa')} />
            {!hasAccounts && accounts.isFetched ? <HeroStat icon={Wallet} label="Personaliza" value="Agregar cuentas" onPress={() => router.push('/cuentas')} accent /> : null}
          </View>
          {hasAccounts ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {accounts.data!.slice(0, 12).map((a) => (a.provider ? <BrandLogo key={a.provider_id + (a.product_id ?? '')} name={a.provider.name} domain={a.provider.domain} logoUrl={a.provider.logo_url} color={a.provider.brand_color} size={30} shape="circle" /> : null))}
            </ScrollView>
          ) : null}
        </View>
      </Animated.View>

      <WeekStrip value={date} onChange={setDate} counts={counts} />
      <CategoryChips value={category} onChange={setCategory} />

      {isToday && (featured.data?.data.length ?? 0) > 0 ? (
        <View style={{ gap: 10 }}>
          <SectionTitle title="Los que más rinden" subtitle="Destacados de tus cuentas" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }} decelerationRate="fast" snapToInterval={332}>
            {featured.data!.data.map((x) => (
              <View key={x.id} style={{ width: 320 }}>
                <DiscountTicket d={x} compact />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <SectionTitle
        title={isToday ? 'Para hoy' : `Para el ${WEEKDAYS_LONG[d.getDay()]}`}
        subtitle={category ? 'Filtrado por rubro' : 'Ordenados por mayor descuento'}
        action={<Button variant="ghost" size="sm" label="Explorar todo" iconRight={ArrowRight} onPress={() => router.push('/explorar')} />}
      />
      {list.isLoading ? (
        <ListSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nada para este día"
          message={hasAccounts ? 'Prueba otro día o rubro, o agrega más cuentas para descubrir descuentos.' : 'Agrega tus bancos, cajas y clubes para ver tus descuentos.'}
          action={<Button label={hasAccounts ? 'Agregar más cuentas' : 'Agregar mis cuentas'} icon={Wallet} onPress={() => router.push('/cuentas')} />}
        />
      ) : (
        <>
          <TicketGrid items={items} />
          {list.hasNextPage ? <Button variant="secondary" label="Cargar más" loading={list.isFetchingNextPage} onPress={() => list.fetchNextPage()} style={{ alignSelf: 'center' }} /> : null}
        </>
      )}

      {isToday && (ending.data?.data.length ?? 0) > 0 ? (
        <View style={{ gap: 10 }}>
          <SectionTitle title="Vencen pronto" subtitle="Aprovéchalos antes de que terminen" action={<Hourglass size={20} color={colors.coral} />} />
          <TicketGrid items={ending.data!.data} animate={false} />
        </View>
      ) : null}
    </Animated.ScrollView>
  );
}

function HeroStat({ icon: Icon, label, value, onPress, accent }: { icon: typeof MapPin; label: string; value: string; onPress: () => void; accent?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} pressScale={0.96} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: accent ? colors.coin : 'rgba(255,255,255,0.14)' }}>
      <Icon size={18} color={accent ? colors.onCoin : colors.onPrimary} />
      <View>
        <Text variant="caption" style={{ color: accent ? colors.onCoin : colors.onPrimary, opacity: 0.8 }}>
          {label}
        </Text>
        <Text variant="smallStrong" style={{ color: accent ? colors.onCoin : colors.onPrimary }}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}
