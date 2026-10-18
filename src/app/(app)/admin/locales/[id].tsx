import { useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ExternalLink, MapPinOff, RefreshCw, SearchX, Store, Trash2 } from 'lucide-react-native';
import { useAdminMerchant, useDeleteLocation, useRelocateMerchant } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Chip';
import { Button, IconButton } from '@/components/ui/Button';
import { Pressable } from '@/components/ui/Pressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/Toast';
import { BrandLogo, logoFor } from '@/components/brand/BrandLogo';
import { DiscountMap } from '@/components/map/DiscountMap';
import type { MapMarker } from '@/components/map/mapTypes';
import { LocationsStatusBadge } from '@/components/admin/LocationsStatus';
import { categoryName } from '@/constants/categories';
import { DEFAULT_COORDS } from '@/services/location';
import { formatNumber } from '@/lib/format';
import { relativeTime } from '@/lib/dates';
import type { MerchantLocation } from '@/types/domain';

const SOURCE_LABEL: Record<MerchantLocation['source'], string> = { osm: 'OpenStreetMap', address: 'Dirección de la fuente', manual: 'Manual' };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function AdminLocalDetail() {
  return (
    <RoleGate roles={['admin']}>
      <Detail />
    </RoleGate>
  );
}

function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const dialog = useDialog();
  const toast = useToast();
  const q = useAdminMerchant(id);
  const relocate = useRelocateMerchant();
  const del = useDeleteLocation();
  const [selected, setSelected] = useState<string | null>(null);
  const [center, setCenter] = useState(DEFAULT_COORDS);
  const [text, setText] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const m = q.data;

  const regions = useMemo(() => [...new Set((m?.locations ?? []).map((l) => l.region).filter(Boolean) as string[])].sort(), [m?.locations]);
  const visible = useMemo(() => {
    const n = fold(text.trim());
    return (m?.locations ?? []).filter((l) => (!region || l.region === region) && (!n || fold(`${l.name ?? ''} ${l.address ?? ''} ${l.comuna ?? ''}`).includes(n)));
  }, [m?.locations, text, region]);

  const markers = useMemo<MapMarker[]>(
    () =>
      visible.map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        title: m?.name ?? '',
        subtitle: l.address ?? '',
        badge: (l.comuna ?? l.region ?? '').slice(0, 14),
        logo: logoFor(m?.domain, m?.logo_url),
        color: m?.brand_color ?? colors.primary,
        count: 1,
      })),
    [visible, m?.name, m?.domain, m?.logo_url, m?.brand_color, colors.primary],
  );

  const focus = (l: MerchantLocation) => {
    setSelected(l.id);
    setCenter({ lat: l.lat, lng: l.lng });
  };

  const relocateNow = async () => {
    if (!m) return;
    try {
      await relocate.mutateAsync(m.id);
      toast.show({ kind: 'success', title: 'En cola', message: `El worker volverá a buscar los locales de ${m.name} en unos minutos.` });
    } catch (e) {
      toast.show({ kind: 'error', title: 'No se pudo encolar', message: (e as Error).message });
    }
  };

  const remove = async (l: MerchantLocation) => {
    const ok = await dialog.confirm({ title: 'Eliminar local', message: `${l.address ?? l.name ?? 'Este local'}${l.comuna ? `, ${l.comuna}` : ''} dejará de aparecer en el mapa.`, tone: 'danger', confirmLabel: 'Eliminar' });
    if (!ok) return;
    try {
      await del.mutateAsync(l.id);
      if (selected === l.id) setSelected(null);
      toast.show({ kind: 'success', title: 'Local eliminado' });
    } catch (e) {
      toast.show({ kind: 'error', title: 'No se pudo eliminar', message: (e as Error).message });
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/admin/locales' as never));

  if (q.isLoading) {
    return (
      <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1400}>
        <Skeleton width={260} height={36} />
        <ListSkeleton count={4} />
      </Screen>
    );
  }
  if (!m) {
    return (
      <Screen topInset={false}>
        <EmptyState icon={Store} title="Comercio no encontrado" message="Puede haber sido eliminado." action={<Button label="Volver a Locales" onPress={back} />} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1400}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <IconButton icon={ArrowLeft} label="Volver" onPress={back} />
        <BrandLogo name={m.name} domain={m.domain} logoUrl={m.logo_url} color={m.brand_color} size={52} />
        <View style={{ flex: 1, minWidth: 220, gap: 4 }}>
          <Text variant="h1" numberOfLines={1}>
            {m.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text tone="soft">{categoryName(m.category)}</Text>
            <LocationsStatusBadge status={m.locations_status} />
            {m.locations_checked_at ? (
              <Text variant="caption" tone="muted">
                Revisado {relativeTime(m.locations_checked_at)}
              </Text>
            ) : null}
          </View>
        </View>
        <Button variant="secondary" icon={RefreshCw} label="Buscar locales de nuevo" loading={relocate.isPending} onPress={relocateNow} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[
          { label: 'Locales', value: m.locations.length },
          { label: 'Regiones', value: regions.length },
          { label: 'Descuentos activos', value: m.active_discounts },
          { label: 'Direcciones sin ubicar', value: m.addresses.length },
        ].map((k) => (
          <View key={k.label} style={{ flexGrow: 1, minWidth: 150, width: isDesktop ? '22%' : '45%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 }}>
            <Text variant="h2">{formatNumber(k.value)}</Text>
            <Text variant="caption" tone="soft">
              {k.label}
            </Text>
          </View>
        ))}
      </View>

      {m.locations.length === 0 ? (
        <Panel>
          <EmptyState
            icon={MapPinOff}
            title="Aún no hay locales ubicados"
            message={m.locations_status === 'pending' ? 'Está en la cola: el worker lo procesará pronto.' : 'OpenStreetMap no tiene sucursales con este nombre. Puedes volver a intentarlo más tarde.'}
          />
        </Panel>
      ) : (
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'stretch' }}>
          <View style={{ flex: isDesktop ? 1.4 : undefined, height: isDesktop ? 620 : 380, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
            <DiscountMap
              center={center}
              markers={markers}
              selectedId={selected}
              onSelect={(lid) => setSelected(lid)}
              dark={isDark}
              colors={colors}
              fitToMarkers
              focusZoom={16}
              accessibilityLabel={`Mapa de locales de ${m.name}`}
            />
          </View>
          <Panel title={`Locales (${formatNumber(visible.length)})`} style={{ flex: 1, height: isDesktop ? 620 : undefined }}>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Input kind="search" placeholder="Dirección o comuna" value={text} onChangeText={setText} containerStyle={{ flex: 1, minWidth: 180 }} />
              {regions.length > 1 ? (
                <View style={{ width: 190 }}>
                  <Select placeholder="Todas las regiones" clearable value={region} onChange={(v) => setRegion((v as string) ?? null)} options={regions.map((r) => ({ value: r, label: r }))} />
                </View>
              ) : null}
            </View>
            {visible.length === 0 ? (
              <EmptyState icon={SearchX} title="Sin locales con ese filtro" message="Prueba con otra dirección, comuna o región." />
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }} scrollEnabled={isDesktop} nestedScrollEnabled>
                {visible.map((l) => {
                  const on = l.id === selected;
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => focus(l)}
                      pressScale={0.99}
                      accessibilityLabel={`Ver en el mapa: ${l.address ?? l.name ?? 'local'}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: on ? colors.coin : colors.line, backgroundColor: on ? colors.surfaceAlt : colors.surface }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="smallStrong" numberOfLines={1}>
                          {l.address || l.name || 'Sin dirección'}
                        </Text>
                        <Text variant="caption" tone="soft" numberOfLines={1}>
                          {[l.comuna, l.region].filter(Boolean).join(', ') || 'Comuna desconocida'}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <Badge label={SOURCE_LABEL[l.source]} tone={l.source === 'osm' ? 'sky' : l.source === 'address' ? 'mint' : 'neutral'} />
                        </View>
                      </View>
                      {l.external_ref ? <IconButton icon={ExternalLink} label="Abrir en OpenStreetMap" tone="ghost" size={34} onPress={() => Linking.openURL(`https://www.openstreetmap.org/${l.external_ref}`)} /> : null}
                      <IconButton icon={Trash2} label="Eliminar local" tone="ghost" size={34} onPress={() => remove(l)} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Panel>
        </View>
      )}

      {m.addresses.length ? (
        <Panel title="Direcciones publicadas sin ubicar">
          <Text variant="small" tone="soft">
            Direcciones que entregó alguna fuente y aún no se encuentran en OpenStreetMap (o están esperando su turno).
          </Text>
          {m.addresses.map((a) => (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <View style={{ flex: 1 }}>
                <Text variant="small">{[a.address, a.comuna, a.region].filter(Boolean).join(', ')}</Text>
                {a.error ? (
                  <Text variant="caption" tone="muted">
                    {a.error}
                  </Text>
                ) : null}
              </View>
              <Badge label={a.status === 'pending' ? 'En cola' : 'No encontrada'} tone={a.status === 'pending' ? 'sky' : 'neutral'} />
            </View>
          ))}
        </Panel>
      ) : null}
    </Screen>
  );
}
