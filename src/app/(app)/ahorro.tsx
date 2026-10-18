import { useState } from 'react';
import { View } from 'react-native';
import { PiggyBank, Plus, Target, Trash2 } from 'lucide-react-native';
import { useDeleteSaving, useMe, useSavings, useSavingsStats, useUpdateMe } from '@/hooks/queries';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ChartSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDialog } from '@/components/ui/DialogProvider';
import { AreaChart, BarChart, DonutChart, RadialGauge, RankBars } from '@/components/charts';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { LogSavingModal } from '@/components/profile/LogSavingModal';
import { categoryName } from '@/constants/categories';
import { compactCLP, formatCLP } from '@/lib/format';
import { formatDate, MONTHS, WEEKDAYS_SHORT } from '@/lib/dates';

export default function Ahorro() {
  const { colors } = useTheme();
  const { isPhone, isDesktop } = useBreakpoint();
  const dialog = useDialog();
  const me = useMe();
  const updateMe = useUpdateMe();
  const stats = useSavingsStats();
  const [page, setPage] = useState(1);
  const history = useSavings(page, 8);
  const del = useDeleteSaving();
  const [logOpen, setLogOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const s = stats.data;
  const half = isDesktop ? '49%' : '100%';

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} refreshing={stats.isRefetching} onRefresh={() => stats.refetch()}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Text variant="h1">Mi ahorro</Text>
          <Text tone="soft">Lo que te has ahorrado usando descuentos</Text>
        </View>
        <Button variant="coin" icon={Plus} label="Registrar ahorro" onPress={() => setLogOpen(true)} />
      </View>

      <View style={{ flexDirection: isPhone ? 'column' : 'row', gap: 16 }}>
        <Panel tone="ink" style={{ flex: 1.3, justifyContent: 'space-between' }}>
          <Text variant="bodyStrong" style={{ color: colors.onPrimary, opacity: 0.8 }}>
            Ahorro total
          </Text>
          {stats.isLoading ? <Skeleton width={200} height={56} /> : <Text variant="hero" style={{ color: colors.onPrimary }}>{formatCLP(s?.total_saved ?? 0)}</Text>}
          <Text style={{ color: colors.onPrimary, opacity: 0.8 }}>
            en {s?.entries ?? 0} compras con descuento. ¡Son {Math.floor((s?.total_saved ?? 0) / 1000)} lukitas!
          </Text>
        </Panel>
        <Panel style={{ flex: 1, alignItems: 'center' }} title="Meta del mes" action={<IconButton icon={Target} label="Cambiar meta" size={34} onPress={() => { setGoal(String(me.data?.monthly_goal ?? '')); setGoalOpen(true); }} />}>
          {stats.isLoading ? (
            <Skeleton width={170} height={170} radius={85} />
          ) : (
            <RadialGauge value={s?.month_saved ?? 0} goal={s?.month_goal ?? 30000} display={compactCLP(s?.month_saved ?? 0)} label={`de ${compactCLP(s?.month_goal ?? 30000)} este mes`} />
          )}
        </Panel>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
        <Panel title="Ahorro por mes" style={{ width: half }}>
          {stats.isLoading ? <ChartSkeleton /> : <AreaChart data={(s?.by_month ?? []).map((m) => ({ label: MONTHS[Number(m.month.slice(5, 7)) - 1].slice(0, 3), value: m.saved }))} format={formatCLP} height={220} color={colors.primary} />}
        </Panel>
        <Panel title="Por rubro" style={{ width: half }}>
          {stats.isLoading ? <ChartSkeleton /> : (s?.by_category.length ?? 0) === 0 ? <Text tone="muted">Aún no hay datos.</Text> : <DonutChart data={s!.by_category.map((c) => ({ label: categoryName(c.category), value: c.saved }))} format={compactCLP} centerValue={compactCLP(s!.total_saved)} centerLabel="total" />}
        </Panel>
        <Panel title="Cuentas que más te ahorran" style={{ width: half }}>
          {stats.isLoading ? (
            <ChartSkeleton height={180} />
          ) : (
            <RankBars
              format={compactCLP}
              data={(s?.by_provider ?? []).slice(0, 6).map((p) => ({ label: p.provider.name, value: p.saved, color: p.provider.brand_color ?? undefined, leading: <BrandLogo name={p.provider.name} domain={p.provider.domain} logoUrl={p.provider.logo_url} color={p.provider.brand_color} size={32} /> }))}
            />
          )}
        </Panel>
        <Panel title="¿Qué día ahorras más?" style={{ width: half }}>
          {stats.isLoading ? (
            <ChartSkeleton height={180} />
          ) : (
            (() => {
              const map = new Map((s?.by_weekday ?? []).map((w) => [w.weekday, w.saved]));
              const max = Math.max(0, ...map.values());
              return <BarChart format={compactCLP} data={[1, 2, 3, 4, 5, 6, 0].map((wd) => ({ label: WEEKDAYS_SHORT[wd], value: map.get(wd) ?? 0, highlight: max > 0 && map.get(wd) === max }))} />;
            })()
          )}
        </Panel>
      </View>

      <Panel title="Historial">
        {history.isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={56} radius={14} />
            ))}
          </View>
        ) : (history.data?.data.length ?? 0) === 0 ? (
          <EmptyState icon={PiggyBank} title="Tu alcancía está vacía" message="Cada vez que uses un descuento, regístralo para ver cuánto llevas ahorrado." action={<Button label="Registrar mi primer ahorro" onPress={() => setLogOpen(true)} />} />
        ) : (
          <>
            {history.data!.data.map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                {e.provider ? <BrandLogo name={e.provider.name} domain={e.provider.domain} logoUrl={e.provider.logo_url} color={e.provider.brand_color} size={38} /> : <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.coinSoft }} />}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {e.merchant_name ?? e.provider?.name ?? 'Compra'}
                  </Text>
                  <Text variant="caption" tone="soft">
                    {formatDate(e.used_on)} · pagaste {formatCLP(e.amount_spent)}
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.mintSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text variant="smallStrong" tone="mint">
                    −{formatCLP(e.amount_saved)}
                  </Text>
                </View>
                <IconButton
                  icon={Trash2}
                  label="Eliminar registro"
                  tone="ghost"
                  size={34}
                  onPress={async () => {
                    if (await dialog.confirm({ title: 'Eliminar este registro', message: 'Se descontará de tu ahorro total. Esta acción no se puede deshacer.', tone: 'danger', confirmLabel: 'Eliminar' })) del.mutate(e.id);
                  }}
                />
              </View>
            ))}
            <Pagination page={page} pageSize={8} total={history.data!.total} onPageChange={setPage} />
          </>
        )}
      </Panel>

      <LogSavingModal visible={logOpen} onClose={() => setLogOpen(false)} />
      <Modal
        visible={goalOpen}
        onClose={() => setGoalOpen(false)}
        title="Meta de ahorro mensual"
        presentation="dialog"
        width={420}
        footer={
          <Button
            label="Guardar meta"
            loading={updateMe.isPending}
            onPress={async () => {
              await updateMe.mutateAsync({ monthly_goal: Number(goal) || null });
              stats.refetch();
              setGoalOpen(false);
            }}
          />
        }
      >
        <Input kind="currency" label="¿Cuánto quieres ahorrar al mes?" placeholder="30000" value={goal} onChangeText={setGoal} maxLength={8} autoFocus />
      </Modal>
    </Screen>
  );
}
