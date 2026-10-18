import { useMemo, useState } from 'react';
import { Linking, Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, BadgeDollarSign, CalendarRange, Clock, CreditCard, ExternalLink, Flag, Heart, MapPin, PiggyBank, Share2, ShoppingBag, Trophy, Wifi } from 'lucide-react-native';
import { useDiscount, useReportDiscount, useToggleFavorite } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAppStore } from '@/stores/useAppStore';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { DayDots } from '@/components/discounts/DayDots';
import { discountHeadline, estimateSaving, headlineText } from '@/components/discounts/discountFormat';
import { MerchantLocations } from '@/components/discounts/MerchantLocations';
import { LogSavingModal } from '@/components/profile/LogSavingModal';
import { categoryName, DISCOUNT_TYPE_LABEL } from '@/constants/categories';
import { describeDays, formatDate, formatTime } from '@/lib/dates';
import { formatCLP } from '@/lib/format';
import { env } from '@/lib/env';

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function DiscountDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { isDesktop } = useBreakpoint();
  const toast = useToast();
  const coords = useAppStore((s) => s.coords);
  const q = useDiscount(id);
  const fav = useToggleFavorite();
  const [amount, setAmount] = useState('30000');
  const [logOpen, setLogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const d = q.data;

  const locations = useMemo(() => {
    if (!d) return [];
    return [...d.locations].map((l) => ({ ...l, distance: coords ? distance(coords, l) : null })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [d, coords]);

  if (q.isLoading) {
    return (
      <Screen topInset={false} contentStyle={{ gap: 16 }}>
        <Skeleton height={220} radius={28} />
        <Skeleton height={28} width="60%" />
        <Skeleton height={140} radius={20} />
      </Screen>
    );
  }
  if (!d) return <Screen topInset={false}><EmptyState icon={ShoppingBag} title="Este descuento ya no está disponible" message="Puede haber vencido o sido retirado por el proveedor." action={<Button label="Volver" onPress={() => router.back()} />} /></Screen>;

  const head = discountHeadline(d.discount_type, d.value);
  const amountN = Number(amount) || 0;
  const saving = estimateSaving(d, amountN);
  const options = [{ provider: d.provider, discount: d, estimated_saving: saving, applies_today: true, current: true }, ...d.alternatives.map((a) => ({ ...a, estimated_saving: estimateSaving(a.discount, amountN), current: false }))].sort((a, b) => b.estimated_saving - a.estimated_saving);

  const share = async () => {
    const url = `${env.siteUrl || ''}/descuento/${d.id}`;
    const msg = `${head.big} ${head.small} en ${d.merchant?.name ?? d.title} con ${d.provider.name} (${describeDays(d.days_of_week).toLowerCase()}). Lo vi en Lukita: ${url}`;
    if (Platform.OS === 'web' && navigator.share) await navigator.share({ title: 'Lukita', text: msg, url }).catch(() => undefined);
    else if (Platform.OS === 'web') {
      await navigator.clipboard?.writeText(msg);
      toast.show({ kind: 'success', title: 'Enlace copiado' });
    } else await Share.share({ message: msg });
  };

  const facts = [
    { icon: CalendarRange, label: 'Días', value: describeDays(d.days_of_week) },
    d.time_start || d.time_end ? { icon: Clock, label: 'Horario', value: `${formatTime(d.time_start) || '00:00'} a ${formatTime(d.time_end) || '23:59'}` } : null,
    { icon: CalendarRange, label: 'Vigencia', value: d.valid_to ? `Hasta el ${formatDate(d.valid_to)}` : 'Sin fecha de término' },
    d.cap_amount ? { icon: BadgeDollarSign, label: 'Tope de descuento', value: formatCLP(d.cap_amount) } : null,
    d.min_purchase ? { icon: ShoppingBag, label: 'Compra mínima', value: formatCLP(d.min_purchase) } : null,
    { icon: d.channel === 'online' ? Wifi : MapPin, label: 'Dónde', value: d.channel === 'online' ? 'Online' : d.channel === 'both' ? 'Presencial y online' : 'Presencial' },
    { icon: CreditCard, label: 'Tipo', value: DISCOUNT_TYPE_LABEL[d.discount_type] },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon={ArrowLeft} label="Volver" onPress={() => (router.canGoBack() ? router.back() : router.replace('/hoy'))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon={Share2} label="Compartir" onPress={share} />
          <IconButton icon={Heart} label={d.is_favorite ? 'Quitar de favoritos' : 'Guardar'} onPress={() => fav.mutate({ id: d.id, on: !d.is_favorite })} tone={d.is_favorite ? 'primary' : 'default'} />
        </View>
      </View>

      <Animated.View entering={FadeInUp.duration(400)} style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primary, flexDirection: isDesktop ? 'row' : 'column' }}>
        <View style={{ backgroundColor: colors.coin, padding: 28, alignItems: 'center', justifyContent: 'center', minWidth: isDesktop ? 260 : undefined }}>
          <Text variant="hero" style={{ color: colors.onCoin, fontSize: 72, lineHeight: 74 }}>
            {head.big}
          </Text>
          <Text variant="title" style={{ color: colors.onCoin }}>
            {head.small}
          </Text>
        </View>
        <View style={{ flex: 1, padding: 24, gap: 12 }}>
          {d.image_url ? <Image source={{ uri: d.image_url }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', opacity: 0.18 }} contentFit="cover" /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BrandLogo name={d.merchant?.name ?? d.title} domain={d.merchant?.domain} logoUrl={d.merchant?.logo_url} color={d.merchant?.brand_color} size={52} />
            <View style={{ flex: 1 }}>
              <Text variant="h2" style={{ color: colors.onPrimary }}>
                {d.merchant?.name ?? d.title}
              </Text>
              <Text style={{ color: colors.onPrimary, opacity: 0.8 }}>{categoryName(d.category)}</Text>
            </View>
          </View>
          <Text variant="title" style={{ color: colors.onPrimary }}>
            {d.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.pill, paddingRight: 12, padding: 4 }}>
              <BrandLogo name={d.provider.name} domain={d.provider.domain} logoUrl={d.provider.logo_url} color={d.provider.brand_color} size={26} shape="circle" />
              <Text variant="smallStrong" style={{ color: colors.onPrimary }}>
                {d.provider.name}
              </Text>
            </View>
            {d.code ? <Badge label={`Código: ${d.code}`} tone="coin" /> : null}
          </View>
        </View>
      </Animated.View>

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flex: 1.3, gap: 16, width: '100%' }}>
          <Animated.View entering={FadeInDown.delay(80)}>
            <Panel title="Condiciones">
              <DayDots days={d.days_of_week} size={26} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {facts.map((f) => (
                  <View key={f.label} style={{ flexDirection: 'row', gap: 10, width: isDesktop ? '47%' : '100%' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      <f.icon size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" tone="muted">
                        {f.label}
                      </Text>
                      <Text variant="smallStrong">{f.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {d.description ? <Text tone="soft">{d.description}</Text> : null}
              {d.terms ? (
                <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 14 }}>
                  <Text variant="caption" tone="soft">
                    {d.terms}
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="coin" icon={PiggyBank} label="Lo usé: registrar ahorro" onPress={() => setLogOpen(true)} />
                {d.source_url ? <Button variant="secondary" icon={ExternalLink} label="Ver en el sitio oficial" onPress={() => Linking.openURL(d.source_url!)} /> : null}
                <Button variant="ghost" icon={Flag} label="Reportar un problema" onPress={() => setReportOpen(true)} />
              </View>
            </Panel>
          </Animated.View>

          <MerchantLocations merchant={d.merchant} locations={locations} channel={d.channel} locationsStatus={d.locations_status ?? null} badge={head.big} user={coords} />
        </View>

        <Panel title="¿Con qué pago?" style={{ flex: 1, width: '100%' }} tone="raised">
          <Text variant="small" tone="soft">
            Compara tus cuentas en este comercio según lo que vas a gastar.
          </Text>
          <Input kind="currency" label="Monto de tu compra" value={amount} onChangeText={setAmount} maxLength={9} />
          {options.map((o, i) => (
            <View key={o.discount.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md, backgroundColor: i === 0 ? colors.coinSoft : 'transparent', borderWidth: o.current ? 1.5 : 0, borderColor: colors.primary }}>
              {i === 0 ? <Trophy size={18} color={colors.ink} /> : <View style={{ width: 18 }} />}
              <BrandLogo name={o.provider.name} domain={o.provider.domain} logoUrl={o.provider.logo_url} color={o.provider.brand_color} size={32} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="smallStrong" numberOfLines={1}>
                  {o.provider.name}
                </Text>
                <Text variant="caption" tone="soft" numberOfLines={1}>
                  {headlineText(o.discount.discount_type, o.discount.value)} · {describeDays(o.discount.days_of_week)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="bodyStrong" tone={o.estimated_saving ? 'mint' : 'muted'}>
                  {o.estimated_saving ? `−${formatCLP(o.estimated_saving)}` : '—'}
                </Text>
                {amountN > 0 ? (
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    Pagas {formatCLP(Math.max(0, amountN - (o.estimated_saving || 0)))}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
          {options.length === 1 ? (
            <Text variant="caption" tone="muted">
              No hay otras cuentas tuyas con descuento en este comercio.
            </Text>
          ) : null}
        </Panel>
      </View>

      <LogSavingModal visible={logOpen} onClose={() => setLogOpen(false)} discount={d} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} id={d.id} />
    </Screen>
  );
}

function ReportModal({ visible, onClose, id }: { visible: boolean; onClose: () => void; id: string }) {
  const toast = useToast();
  const report = useReportDiscount();
  const [reason, setReason] = useState<string | null>('expired');
  const [comment, setComment] = useState('');
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Reportar un problema"
      subtitle="Nos ayudas a mantener los descuentos al día"
      footer={
        <Button
          label="Enviar reporte"
          loading={report.isPending}
          onPress={async () => {
            await report.mutateAsync({ id, reason: reason ?? 'other', comment: comment.trim() || undefined });
            toast.show({ kind: 'success', title: 'Reporte enviado', message: 'Lo revisaremos pronto. ¡Gracias!' });
            setComment('');
            onClose();
          }}
        />
      }
    >
      <Select
        label="¿Qué pasó?"
        value={reason}
        onChange={(v) => setReason(v as string)}
        options={[
          { value: 'expired', label: 'Ya no está vigente' },
          { value: 'not_applied', label: 'No me lo aplicaron' },
          { value: 'wrong_info', label: 'La información está mal' },
          { value: 'other', label: 'Otro' },
        ]}
      />
      <Input kind="multiline" label="Detalles (opcional)" value={comment} onChangeText={setComment} maxLength={500} placeholder="Cuéntanos qué viste" />
    </Modal>
  );
}
