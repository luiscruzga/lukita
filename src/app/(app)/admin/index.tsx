import { useState } from 'react';
import { View } from 'react-native';
import { Flag, Megaphone, Store, Ticket, Users, MapPin, PiggyBank } from 'lucide-react-native';
import { useAdminStats, useBroadcast } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ChartSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogProvider';
import { AreaChart, DonutChart, RankBars } from '@/components/charts';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { categoryName, ROLE_LABEL } from '@/constants/categories';
import { compactCLP, formatNumber } from '@/lib/format';
import type { Role } from '@/types/domain';

export default function AdminHome() {
  return (
    <RoleGate roles={['admin', 'moderator']}>
      <Dashboard />
    </RoleGate>
  );
}

function Dashboard() {
  const { colors } = useTheme();
  const { isDesktop, isPhone } = useBreakpoint();
  const stats = useAdminStats();
  const s = stats.data;
  const kpis = [
    { icon: Users, label: 'Usuarios', value: formatNumber(s?.users), sub: `+${s?.users_7d ?? 0} esta semana` },
    { icon: Ticket, label: 'Descuentos activos', value: formatNumber(s?.discounts_active) },
    { icon: Store, label: 'Proveedores', value: formatNumber(s?.providers), sub: `${s?.merchants ?? 0} comercios` },
    { icon: MapPin, label: 'Locales en mapa', value: formatNumber(s?.locations) },
    { icon: Flag, label: 'Reportes abiertos', value: formatNumber(s?.open_reports), alert: (s?.open_reports ?? 0) > 0 },
    { icon: PiggyBank, label: 'Ahorro registrado', value: compactCLP(s?.savings_total ?? 0) },
  ];
  const half = isDesktop ? '49%' : '100%';
  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} refreshing={stats.isRefetching} onRefresh={() => stats.refetch()}>
      <Text variant="h1">Panel de administración</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {kpis.map((k) => (
          <View key={k.label} style={{ width: isPhone ? '47%' : isDesktop ? '15.5%' : '31%', flexGrow: 1, backgroundColor: k.alert ? colors.coralSoft : colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 8 }}>
            <k.icon size={20} color={k.alert ? colors.coral : colors.primary} />
            {stats.isLoading ? <Skeleton width={70} height={28} /> : <Text variant="h2">{k.value}</Text>}
            <Text variant="caption" tone="soft">
              {k.label}
            </Text>
            {k.sub ? (
              <Text variant="caption" tone="mint">
                {k.sub}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
        <Panel title="Registros por semana" style={{ width: half }}>
          {stats.isLoading ? <ChartSkeleton /> : <AreaChart data={(s?.signups_by_week ?? []).map((w) => ({ label: w.week.slice(5), value: w.count }))} color={colors.mint} />}
        </Panel>
        <Panel title="Descuentos por rubro" style={{ width: half }}>
          {stats.isLoading ? <ChartSkeleton /> : <DonutChart data={(s?.discounts_by_category ?? []).slice(0, 7).map((c) => ({ label: categoryName(c.category), value: c.count }))} centerValue={formatNumber(s?.discounts_active)} centerLabel="activos" />}
        </Panel>
        <Panel title="Proveedores con más descuentos" style={{ width: half }}>
          {stats.isLoading ? (
            <ChartSkeleton />
          ) : (
            <RankBars data={(s?.top_providers ?? []).slice(0, 8).map((p) => ({ label: p.provider.name, value: p.count, color: p.provider.brand_color ?? undefined, leading: <BrandLogo name={p.provider.name} domain={p.provider.domain} logoUrl={p.provider.logo_url} color={p.provider.brand_color} size={30} /> }))} />
          )}
        </Panel>
        <BroadcastPanel style={{ width: half }} />
      </View>
    </Screen>
  );
}

function BroadcastPanel({ style }: { style: object }) {
  const toast = useToast();
  const dialog = useDialog();
  const send = useBroadcast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  return (
    <Panel title="Enviar notificación" style={style} action={<Megaphone size={20} color="#FFB81C" />}>
      <Input kind="text" label="Título" value={title} onChangeText={setTitle} maxLength={80} placeholder="¡Nuevo descuento de bencina!" />
      <Input kind="multiline" label="Mensaje" value={body} onChangeText={setBody} maxLength={240} placeholder="Los jueves, $100 por litro con…" />
      <Select label="Destinatarios" placeholder="Todos los usuarios" clearable value={role} onChange={(v) => setRole((v as Role) ?? null)} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value: value as Role, label }))} />
      <Button
        label="Enviar"
        icon={Megaphone}
        loading={send.isPending}
        disabled={!title.trim() || !body.trim()}
        onPress={async () => {
          if (!(await dialog.confirm({ title: 'Enviar a los usuarios', message: `Se enviará "${title}" a ${role ? ROLE_LABEL[role] : 'todos los usuarios'} con notificaciones activas.`, confirmLabel: 'Enviar' }))) return;
          const r = await send.mutateAsync({ title: title.trim(), body: body.trim(), role });
          toast.show({ kind: 'success', title: 'Notificación enviada', message: `${r.sent} destinatarios` });
          setTitle('');
          setBody('');
        }}
      />
    </Panel>
  );
}
