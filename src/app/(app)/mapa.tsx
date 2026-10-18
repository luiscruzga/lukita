import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import type { ComponentRef } from 'react';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crosshair, LocateFixed, MapPinOff, Navigation } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAccounts, useNearby } from '@/hooks/queries';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_COORDS, requestCurrentPosition } from '@/services/location';
import { DiscountMap } from '@/components/map/DiscountMap';
import type { MapMarker } from '@/components/map/mapTypes';
import { logoFor, BrandLogo } from '@/components/brand/BrandLogo';
import { discountHeadline } from '@/components/discounts/discountFormat';
import { DayDots } from '@/components/discounts/DayDots';
import { CategoryChips } from '@/components/discounts/CategoryChips';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { IconButton, Button } from '@/components/ui/Button';
import { Pressable } from '@/components/ui/Pressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistance } from '@/lib/format';
import type { NearbyDiscount } from '@/types/domain';

const RADII = [500, 1000, 3000, 8000];

export default function Mapa() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoint();
  const coords = useAppStore((s) => s.coords);
  const status = useAppStore((s) => s.locationStatus);
  const setLocation = useAppStore((s) => s.setLocation);
  const accounts = useAccounts();
  const [radiusM, setRadius] = useState(3000);
  const [mine, setMine] = useState(true);
  const [onlyToday, setOnlyToday] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [center, setCenter] = useState(coords ?? DEFAULT_COORDS);
  const [query, setQuery] = useState(coords ?? DEFAULT_COORDS);
  const [selected, setSelected] = useState<string | null>(null);
  const listRef = useRef<ComponentRef<typeof FlatList<NearbyDiscount>>>(null);

  useEffect(() => {
    if (accounts.isFetched && !accounts.data?.length) setMine(false);
  }, [accounts.isFetched, accounts.data?.length]);
  useEffect(() => {
    if (coords) {
      setCenter(coords);
      setQuery(coords);
    }
  }, [coords]);

  const nearby = useNearby({ lat: query.lat, lng: query.lng, radius: radiusM, mine, day: onlyToday ? new Date().getDay() : null, category }, accounts.isFetched);
  const items = nearby.data ?? [];

  // Agrupa por local: un pin por tienda con el mejor descuento y "+N".
  const markers = useMemo<MapMarker[]>(() => {
    const byLoc = new Map<string, NearbyDiscount[]>();
    items.forEach((i) => byLoc.set(i.location_id, [...(byLoc.get(i.location_id) ?? []), i]));
    return [...byLoc.entries()].map(([id, list]) => {
      const best = [...list].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
      return { id, lat: best.lat, lng: best.lng, title: best.merchant.name, subtitle: best.title, badge: discountHeadline(best.discount_type, best.value).big, logo: logoFor(best.merchant.domain, best.merchant.logo_url), color: best.merchant.brand_color ?? colors.primary, count: list.length };
    });
  }, [items, colors.primary]);

  const locate = async () => {
    const r = await requestCurrentPosition();
    setLocation(r.coords, r.status);
    if (r.coords) {
      setCenter({ ...r.coords });
      setQuery({ ...r.coords });
    }
  };

  const select = (locationId: string) => {
    setSelected(locationId);
    const idx = items.findIndex((i) => i.location_id === locationId);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
  };

  const moved = Math.abs(center.lat - query.lat) + Math.abs(center.lng - query.lng) > 0.004;

  const card = ({ item }: { item: NearbyDiscount }) => {
    const h = discountHeadline(item.discount_type, item.value);
    const on = item.location_id === selected;
    return (
      <Pressable
        onPress={() => {
          if (on) router.push(`/descuento/${item.discount_id}`);
          else {
            setSelected(item.location_id);
            setCenter({ lat: item.lat, lng: item.lng });
          }
        }}
        pressScale={0.98}
        style={[{ width: isPhone ? 290 : '100%', flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: on ? colors.coin : colors.line }, elevation(colors, 2)]}
      >
        <BrandLogo name={item.merchant.name} domain={item.merchant.domain} logoUrl={item.merchant.logo_url} color={item.merchant.brand_color} size={46} />
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {item.merchant.name}
            </Text>
            <View style={{ backgroundColor: colors.coin, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text variant="caption" style={{ color: colors.onCoin }}>
                {h.big}
              </Text>
            </View>
          </View>
          <Text variant="caption" tone="soft" numberOfLines={1}>
            {item.provider.name} · {item.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <DayDots days={item.days_of_week} size={14} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Navigation size={12} color={colors.primary} />
              <Text variant="caption" tone="primary">
                {formatDistance(item.distance_m)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: isPhone ? 'column' : 'row' }}>
      <View style={{ flex: 1 }}>
        <DiscountMap center={center} user={coords} radius={radiusM} markers={markers} selectedId={selected} onSelect={select} onMoveEnd={setCenter} dark={isDark} colors={colors} />
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 12, left: 12, right: 12, gap: 8 }}>
          <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 8, gap: 8, borderWidth: 1, borderColor: colors.line }, elevation(colors, 2)]}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {RADII.map((r) => (
                <Chip key={r} size="sm" label={formatDistance(r)} selected={radiusM === r} onPress={() => setRadius(r)} />
              ))}
              <Chip size="sm" label="Hoy" selected={onlyToday} onPress={() => setOnlyToday((v) => !v)} />
              <Chip size="sm" label="Mis cuentas" selected={mine} onPress={() => setMine((v) => !v)} />
            </View>
            <CategoryChips value={category} onChange={setCategory} />
          </View>
          {moved ? (
            <Animated.View entering={FadeInUp} style={{ alignSelf: 'center' }}>
              <Button size="sm" icon={Crosshair} label="Buscar en esta zona" onPress={() => setQuery(center)} />
            </Animated.View>
          ) : null}
        </View>
        <View style={{ position: 'absolute', right: 12, bottom: isPhone ? 196 + insets.bottom : 24 }}>
          <IconButton icon={LocateFixed} label="Centrar en mi ubicación" tone="primary" size={48} onPress={locate} />
        </View>
        {status !== 'granted' && !coords ? (
          <View style={[{ position: 'absolute', left: 12, right: 72, bottom: isPhone ? 196 + insets.bottom : 24, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 8 }, elevation(colors, 2)]}>
            <Text variant="smallStrong">Mostrando el centro de Santiago</Text>
            <Text variant="caption" tone="soft">
              Comparte tu ubicación para ver los descuentos que tienes alrededor.
            </Text>
            <Button size="sm" label="Usar mi ubicación" onPress={locate} />
          </View>
        ) : null}
      </View>

      <View style={isPhone ? { position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 92 } : { width: 380, borderLeftWidth: 1, borderLeftColor: colors.line, backgroundColor: colors.bg }}>
        {!isPhone ? (
          <View style={{ padding: 16, paddingBottom: 8 }}>
            <Text variant="h3">Cerca de ti</Text>
            <Text variant="small" tone="soft">
              {nearby.isLoading ? 'Buscando…' : `${items.length} descuentos en ${markers.length} locales`}
            </Text>
          </View>
        ) : null}
        {nearby.isLoading ? (
          <View style={{ flexDirection: isPhone ? 'row' : 'column', gap: 10, padding: 16 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width={isPhone ? 290 : '100%'} height={86} radius={20} />
            ))}
          </View>
        ) : items.length === 0 ? (
          <View style={{ padding: 16 }}>
            <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }, elevation(colors, 2)]}>
              <MapPinOff size={22} color={colors.inkSoft} />
              <Text variant="small" tone="soft" style={{ flex: 1 }}>
                No hay descuentos en este radio. Amplía la distancia o quita filtros.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(i) => `${i.discount_id}-${i.location_id}`}
            horizontal={isPhone}
            renderItem={card}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, padding: 16, paddingTop: isPhone ? 8 : 4 }}
            onScrollToIndexFailed={() => undefined}
            snapToInterval={isPhone ? 300 : undefined}
            decelerationRate="fast"
          />
        )}
      </View>
    </View>
  );
}
