import { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { Globe, MapPin, MapPinOff, Navigation, Search } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';
import { Pressable } from '@/components/ui/Pressable';
import { logoFor } from '@/components/brand/BrandLogo';
import { DiscountMap } from '@/components/map/DiscountMap';
import { formatDistance } from '@/lib/format';
import type { MerchantLocation } from '@/types/domain';

type Loc = Pick<MerchantLocation, 'id' | 'name' | 'address' | 'comuna' | 'region' | 'lat' | 'lng'> & { distance: number | null };

interface Props {
  merchant: { name: string; domain: string | null; logo_url: string | null; brand_color: string | null } | null;
  locations: Loc[];
  channel: 'in_store' | 'online' | 'both';
  /** Estado de la búsqueda de locales del comercio (worker de OpenStreetMap). */
  locationsStatus: 'pending' | 'done' | 'none' | 'error' | null;
  badge: string;
  user: { lat: number; lng: number } | null;
}

const PREVIEW = 6;
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Abre la ruta en Google Maps (web, Android e iOS la entienden). */
const directions = (l: { lat: number; lng: number }) => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`);

/** "Dónde usarlo": sitio del comercio, mapa con sus locales y la lista con distancia y cómo llegar. */
export function MerchantLocations({ merchant, locations, channel, locationsStatus, badge, user }: Props) {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [all, setAll] = useState(false);
  const [text, setText] = useState('');
  const name = merchant?.name ?? 'el comercio';

  const visible = useMemo(() => {
    const n = fold(text.trim());
    return n ? locations.filter((l) => fold(`${l.name ?? ''} ${l.address ?? ''} ${l.comuna ?? ''} ${l.region ?? ''}`).includes(n)) : locations;
  }, [locations, text]);
  const shown = all || text ? visible : visible.slice(0, PREVIEW);

  const markers = useMemo(
    () =>
      visible.map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        title: name,
        subtitle: l.address ?? '',
        badge,
        logo: logoFor(merchant?.domain, merchant?.logo_url),
        color: merchant?.brand_color ?? colors.primary,
        count: 1,
      })),
    [visible, name, badge, merchant?.domain, merchant?.logo_url, merchant?.brand_color, colors.primary],
  );

  // Con ubicación del usuario se parte en el local más cercano; si no, se encuadran todos.
  const nearest = locations[0];
  const center = focus ?? (user && nearest ? { lat: nearest.lat, lng: nearest.lng } : nearest ? { lat: nearest.lat, lng: nearest.lng } : null);

  const select = (l: Loc) => {
    setSelected(l.id);
    setFocus({ lat: l.lat, lng: l.lng });
  };

  const links = (
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {merchant?.domain ? <Button variant="secondary" size="sm" icon={Globe} label={`Sitio de ${name}`} onPress={() => Linking.openURL(`https://${merchant.domain}`)} /> : null}
      <Button variant="ghost" size="sm" icon={Search} label="Buscar en Google" onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(`${name} Chile`)}`)} />
    </View>
  );

  if (channel === 'online') {
    return (
      <Panel title="Dónde usarlo">
        <Text variant="small" tone="soft">
          Este beneficio es online: úsalo en el sitio o la app de {name}.
        </Text>
        {links}
      </Panel>
    );
  }

  if (!locations.length) {
    return (
      <Panel title="Dónde usarlo">
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <MapPinOff size={20} color={colors.inkSoft} />
          </View>
          <Text variant="small" tone="soft" style={{ flex: 1 }}>
            {locationsStatus === 'pending'
              ? `Estamos ubicando los locales de ${name} en el mapa; vuelve a revisar en un rato.`
              : `Aún no tenemos las direcciones de ${name}. Revisa su sitio o las condiciones del beneficio para saber dónde usarlo.`}
          </Text>
        </View>
        {links}
      </Panel>
    );
  }

  return (
    <Panel title={`Dónde usarlo · ${locations.length} ${locations.length === 1 ? 'local' : 'locales'}`} padded={false}>
      <View style={{ height: 300 }}>
        {center ? (
          <DiscountMap
            center={center}
            user={user}
            markers={markers}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id);
              const l = locations.find((x) => x.id === id);
              if (l) setFocus({ lat: l.lat, lng: l.lng });
            }}
            dark={isDark}
            colors={colors}
            fitToMarkers={!user && !focus}
            focusZoom={15}
            accessibilityLabel={`Mapa de locales de ${name}`}
          />
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 18, paddingBottom: 16, gap: 10 }}>
        {links}
        {locations.length > PREVIEW ? <Input kind="search" placeholder="Busca por comuna o dirección" value={text} onChangeText={setText} /> : null}
        {!user && locations.length > 1 ? (
          <Text variant="caption" tone="muted">
            Activa tu ubicación en el mapa para ordenarlos por cercanía.
          </Text>
        ) : null}
        <View>
          {shown.map((l) => {
            const on = l.id === selected;
            return (
              <Pressable
                key={l.id}
                onPress={() => select(l)}
                pressScale={0.99}
                accessibilityLabel={`Ver en el mapa: ${l.address ?? l.name ?? name}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 6, borderRadius: radius.sm, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: on ? colors.surfaceAlt : 'transparent' }}
              >
                <MapPin size={16} color={on ? colors.coin : colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="smallStrong" numberOfLines={1}>
                    {l.address || l.name || name}
                  </Text>
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    {[l.comuna, l.region].filter(Boolean).join(', ') || 'Comuna desconocida'}
                  </Text>
                </View>
                {l.distance !== null ? (
                  <Text variant="caption" tone="primary">
                    {formatDistance(l.distance)}
                  </Text>
                ) : null}
                <IconButton icon={Navigation} label="Cómo llegar" tone="ghost" size={34} onPress={() => directions(l)} />
              </Pressable>
            );
          })}
          {text && !visible.length ? (
            <Text variant="small" tone="muted" style={{ paddingVertical: 12 }}>
              Ningún local coincide con “{text}”.
            </Text>
          ) : null}
        </View>
        {!text && visible.length > PREVIEW ? <Button variant="ghost" size="sm" label={all ? 'Ver menos' : `Ver los ${visible.length} locales`} onPress={() => setAll((v) => !v)} /> : null}
      </View>
    </Panel>
  );
}
