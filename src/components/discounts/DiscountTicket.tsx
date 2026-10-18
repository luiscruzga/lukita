import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Heart, MapPin, Wifi } from 'lucide-react-native';
import type { Discount } from '@/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { formatRelativeDays } from '@/lib/dates';
import { BrandLogo } from '../brand/BrandLogo';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { DayDots } from './DayDots';
import { discountHeadline } from './discountFormat';

/**
 * Elemento firma de Lukita: el descuento como un cupón troquelado. Talón izquierdo con el valor
 * (tipografía display grande sobre el color del tono), perforación punteada con muescas y cuerpo
 * con comercio, proveedor y días.
 */
export const DiscountTicket = memo(function DiscountTicket({ d, onToggleFavorite, compact }: { d: Discount; onToggleFavorite?: (d: Discount) => void; compact?: boolean }) {
  const { colors } = useTheme();
  const head = discountHeadline(d.discount_type, d.value);
  const strong = d.discount_type === 'percent' && (d.value ?? 0) >= 30;
  const stubBg = d.is_featured || strong ? colors.coin : colors.primary;
  const stubFg = d.is_featured || strong ? colors.onCoin : colors.onPrimary;
  const ending = d.valid_to ? formatRelativeDays(d.valid_to) : null;
  const endingSoon = ending === 'hoy' || ending === 'mañana' || (ending?.startsWith('en ') ?? false);
  const merchantName = d.merchant?.name ?? d.title;

  return (
    <Pressable
      onPress={() => router.push(`/descuento/${d.id}`)}
      pressScale={0.985}
      accessibilityRole="link"
      accessibilityLabel={`${head.big} ${head.small} en ${merchantName} con ${d.provider.name}`}
      style={[styles.ticket, elevation(colors, 1), { backgroundColor: colors.surface, borderColor: colors.line }]}
    >
      <View style={[styles.stub, { backgroundColor: stubBg, width: compact ? 84 : 98 }]}>
        <Text variant="number" style={{ color: stubFg, fontSize: head.big.length > 4 ? 26 : compact ? 30 : 34, lineHeight: compact ? 34 : 38 }} numberOfLines={1} adjustsFontSizeToFit>
          {head.big}
        </Text>
        <Text variant="caption" style={{ color: stubFg, opacity: 0.85 }}>
          {head.small}
        </Text>
      </View>
      <View style={styles.perforation}>
        <View style={[styles.notch, { top: -9, backgroundColor: colors.bg, borderColor: colors.line }]} />
        <View style={[styles.dash, { borderColor: colors.lineStrong }]} />
        <View style={[styles.notch, { bottom: -9, backgroundColor: colors.bg, borderColor: colors.line }]} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <BrandLogo name={merchantName} domain={d.merchant?.domain} logoUrl={d.merchant?.logo_url} color={d.merchant?.brand_color} size={34} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {merchantName}
            </Text>
            <Text variant="caption" tone="soft" numberOfLines={compact ? 1 : 2}>
              {d.title}
            </Text>
          </View>
          {onToggleFavorite ? (
            <Pressable hitSlop={10} pressScale={0.8} haptic onPress={() => onToggleFavorite(d)} accessibilityLabel={d.is_favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
              <Heart size={20} color={d.is_favorite ? colors.coral : colors.inkMuted} fill={d.is_favorite ? colors.coral : 'transparent'} />
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.row, { flexWrap: 'wrap', rowGap: 8 }]}>
          <View style={[styles.providerPill, { backgroundColor: colors.surfaceAlt }]}>
            <BrandLogo name={d.provider.name} domain={d.provider.domain} logoUrl={d.provider.logo_url} color={d.provider.brand_color} size={18} shape="circle" />
            <Text variant="caption" numberOfLines={1} style={{ maxWidth: 130 }}>
              {d.provider.name}
            </Text>
          </View>
          <DayDots days={d.days_of_week} size={compact ? 15 : 17} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {d.channel === 'online' ? <Wifi size={13} color={colors.inkMuted} /> : <MapPin size={13} color={colors.inkMuted} />}
            {ending ? (
              <Text variant="caption" tone={endingSoon ? 'coral' : 'muted'}>
                {ending === 'vencido' ? 'Vencido' : endingSoon ? `Vence ${ending}` : `Hasta el ${ending}`}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  ticket: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', minHeight: 104 },
  stub: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 14 },
  perforation: { width: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  dash: { position: 'absolute', top: 12, bottom: 12, width: 0, borderLeftWidth: 2, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
  body: { flex: 1, padding: 14, paddingLeft: 18, gap: 10, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  providerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10, paddingLeft: 3, paddingVertical: 3, borderRadius: radius.pill },
});
