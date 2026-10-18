import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { BellOff, BellRing, CheckCheck, Send } from 'lucide-react-native';
import { useAlerts, useMarkNotificationsRead, useNotifications, useSaveAlerts } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getPushPermission, notifyLocal, registerForPush, type PushPermission } from '@/services/notifications';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Pressable } from '@/components/ui/Pressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { TimePicker } from '@/components/ui/DatePicker';
import type { AlertRule } from '@/types/domain';

const RULES: { kind: AlertRule['kind']; label: string; description: string }[] = [
  { kind: 'daily_digest', label: 'Resumen del día', description: 'Cada mañana, los mejores descuentos de tus cuentas para hoy' },
  { kind: 'nearby', label: 'Descuentos cerca', description: 'Cuando pases cerca de un local con descuento para hoy' },
  { kind: 'new_from_my_accounts', label: 'Nuevos de mis cuentas', description: 'Cuando tus bancos o clubes publiquen un beneficio nuevo' },
  { kind: 'expiring_favorites', label: 'Favoritos por vencer', description: 'Tres días antes de que termine un favorito' },
];

export default function Notificaciones() {
  const { colors } = useTheme();
  const { isDesktop } = useBreakpoint();
  const toast = useToast();
  const list = useNotifications();
  const mark = useMarkNotificationsRead();
  const alerts = useAlerts();
  const saveAlerts = useSaveAlerts();
  const [perm, setPerm] = useState<PushPermission>('default');
  const [rules, setRules] = useState<AlertRule[]>([]);
  useEffect(() => {
    getPushPermission().then(setPerm);
  }, []);
  useEffect(() => {
    if (alerts.data) setRules(RULES.map((r) => alerts.data!.find((a) => a.kind === r.kind) ?? { kind: r.kind, enabled: r.kind !== 'nearby', config: {} }));
  }, [alerts.data]);
  const items = list.data?.pages.flatMap((p) => p.data) ?? [];
  const unread = list.data?.pages[0]?.unread ?? 0;

  const update = (kind: AlertRule['kind'], patch: Partial<AlertRule>) => {
    const next = rules.map((r) => (r.kind === kind ? { ...r, ...patch, config: { ...r.config, ...(patch.config ?? {}) } } : r));
    setRules(next);
    saveAlerts.mutate(next);
  };

  const enablePush = async () => {
    const ok = await registerForPush();
    setPerm(await getPushPermission());
    toast.show(ok ? { kind: 'success', title: 'Notificaciones activadas', message: 'Te avisaremos de tus mejores descuentos.' } : { kind: 'error', title: 'No se activaron', message: 'Permite las notificaciones en los ajustes del sistema o del navegador.' });
  };

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <Text variant="h1">Alertas</Text>
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 16, width: '100%' }}>
          <Panel tone={perm === 'granted' ? 'flat' : 'raised'} title="Notificaciones del dispositivo">
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: perm === 'granted' ? colors.mintSoft : colors.coinSoft, alignItems: 'center', justifyContent: 'center' }}>
                {perm === 'granted' ? <BellRing size={22} color={colors.mint} /> : <BellOff size={22} color={colors.ink} />}
              </View>
              <Text variant="small" tone="soft" style={{ flex: 1 }}>
                {perm === 'granted' ? 'Activadas en este dispositivo.' : perm === 'denied' ? 'Bloqueadas. Actívalas desde los ajustes del sistema o del navegador.' : perm === 'unsupported' ? 'Este navegador no soporta notificaciones push.' : 'Actívalas para recibir el resumen diario y los descuentos cerca.'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {perm !== 'granted' && perm !== 'unsupported' ? <Button label="Activar notificaciones" icon={BellRing} onPress={enablePush} /> : null}
              {perm === 'granted' ? <Button variant="secondary" icon={Send} label="Enviar una de prueba" onPress={() => notifyLocal('Lukita', '¡Así se verán tus alertas de descuentos! 🪙')} /> : null}
            </View>
          </Panel>
          <Panel title="¿Qué quieres que te avisemos?">
            {alerts.isLoading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} />)
              : RULES.map((r) => {
                  const rule = rules.find((x) => x.kind === r.kind);
                  return (
                    <View key={r.kind} style={{ gap: 10, paddingVertical: 4 }}>
                      <Switch label={r.label} description={r.description} value={!!rule?.enabled} onChange={(enabled) => update(r.kind, { enabled })} />
                      {r.kind === 'daily_digest' && rule?.enabled ? (
                        <TimePicker label="Hora del resumen" value={(rule.config.time as string) ?? '08:30'} onChange={(time) => time && update(r.kind, { config: { time } })} />
                      ) : null}
                    </View>
                  );
                })}
          </Panel>
        </View>
        <Panel
          title={unread ? `Bandeja · ${unread} sin leer` : 'Bandeja'}
          action={unread ? <Button variant="ghost" size="sm" icon={CheckCheck} label="Marcar todo leído" onPress={() => mark.mutate('all')} /> : undefined}
          style={{ flex: 1.2, width: '100%' }}
        >
          {list.isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} height={64} radius={14} />)
          ) : items.length === 0 ? (
            <EmptyState icon={BellRing} title="Sin alertas por ahora" message="Aquí verás el resumen diario y los avisos de tus descuentos." />
          ) : (
            <>
              {items.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => {
                    if (!n.read_at) mark.mutate([n.id]);
                    const id = n.data?.discountId;
                    if (typeof id === 'string') router.push(`/descuento/${id}`);
                  }}
                  pressScale={0.99}
                  style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: n.read_at ? 'transparent' : colors.primarySoft }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: n.read_at ? 'transparent' : colors.primary }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="smallStrong">{n.title}</Text>
                    <Text variant="small" tone="soft">
                      {n.body}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {new Date(n.created_at).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                  </View>
                </Pressable>
              ))}
              {list.hasNextPage ? <Button variant="secondary" label="Ver más" loading={list.isFetchingNextPage} onPress={() => list.fetchNextPage()} /> : null}
            </>
          )}
        </Panel>
      </View>
    </Screen>
  );
}
