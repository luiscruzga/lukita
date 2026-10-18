import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AlertTriangle, CheckCircle2, CircleSlash, Clock, ListFilter, Loader2, MapPin, Monitor, Pause, Play, PlayCircle, RefreshCw, XCircle } from 'lucide-react-native';
import {
  useIngestionOverview,
  useIngestionRun,
  useIngestionRuns,
  useProviders,
  useRunIngestion,
  useUpdateAllSchedules,
  useUpdateIngestionSettings,
  useUpdateSchedule,
  type IngestionRun,
  type IngestionSource,
  type RunStatus,
} from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTableState } from '@/hooks/useTableState';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge, Chip } from '@/components/ui/Chip';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogProvider';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { FrequencyPicker, describeFrequency } from '@/components/admin/FrequencyPicker';
import { formatDateTime, formatDuration, relativeTime } from '@/lib/dates';
import { formatNumber } from '@/lib/format';

const STATUS: Record<RunStatus, { label: string; tone: 'mint' | 'coin' | 'coral' | 'sky' | 'neutral'; icon: typeof CheckCircle2 }> = {
  queued: { label: 'En cola', tone: 'neutral', icon: Clock },
  running: { label: 'En curso', tone: 'sky', icon: Loader2 },
  success: { label: 'Éxito', tone: 'mint', icon: CheckCircle2 },
  partial: { label: 'Parcial', tone: 'coin', icon: AlertTriangle },
  error: { label: 'Error', tone: 'coral', icon: XCircle },
  skipped: { label: 'Omitida', tone: 'neutral', icon: CircleSlash },
};
const TRIGGER: Record<string, string> = { manual: 'Manual', schedule: 'Programada', cli: 'Consola' };

export default function AdminIngest() {
  return (
    <RoleGate roles={['admin']}>
      <Ingest />
    </RoleGate>
  );
}

function Ingest() {
  const { colors } = useTheme();
  const { isDesktop } = useBreakpoint();
  const toast = useToast();
  const dialog = useDialog();
  const overview = useIngestionOverview();
  const providers = useProviders({ pageSize: 100 });
  const updateSettings = useUpdateIngestionSettings();
  const updateAll = useUpdateAllSchedules();
  const run = useRunIngestion();
  const [bulkInterval, setBulkInterval] = useState(1440);
  const [maxPages, setMaxPages] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const t = useTableState({ key: 'started_at', dir: 'desc' }, 10);
  const [source, setSource] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [latest, setLatest] = useState(false);
  const o = overview.data;
  const anyRunning = !!o && (o.scheduler.busy || o.sources.some((s) => s.running));
  const runs = useIngestionRuns({ ...t.params, source, status, trigger, latest }, anyRunning);
  const providerOf = (slug: string) => providers.data?.data.find((p) => p.slug === slug);
  const sourceName = useMemo(() => new Map((o?.sources ?? []).map((s) => [s.id, s.name])), [o?.sources]);

  const runNow = async (id: string, label: string) => {
    try {
      const r = await run.mutateAsync(id);
      if (r.queued.length) toast.show({ kind: 'success', title: r.queued.length > 1 ? `${r.queued.length} fuentes en cola` : `${label} en cola`, message: r.busy.length ? `${r.busy.length} ya estaban ejecutándose.` : 'Puedes seguir el avance en el historial.' });
      else toast.show({ kind: 'info', title: 'Ya se está ejecutando' });
    } catch (e) {
      toast.show({ kind: 'error', title: 'No se pudo iniciar', message: (e as Error).message });
    }
  };

  const togglePause = async () => {
    if (!o) return;
    const pausing = !o.settings.paused;
    if (pausing && !(await dialog.confirm({ title: 'Pausar la sincronización', message: 'No se ejecutará ninguna ingesta programada hasta que la reanudes. Las ejecuciones manuales siguen disponibles.', tone: 'warning', confirmLabel: 'Pausar' }))) return;
    await updateSettings.mutateAsync({ paused: pausing });
    toast.show({ kind: 'success', title: pausing ? 'Sincronización pausada' : 'Sincronización reanudada' });
  };

  const columns: Column<IngestionRun>[] = [
    { key: 'source', title: 'Fuente', width: 200, sortable: true, value: (r) => sourceName.get(r.source) ?? r.source },
    { key: 'status', title: 'Estado', width: 130, sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'trigger', title: 'Origen', width: 120, value: (r) => TRIGGER[r.trigger] ?? r.trigger },
    { key: 'started_at', title: 'Inicio', width: 150, sortable: true, value: (r) => formatDateTime(r.started_at) },
    { key: 'duration_ms', title: 'Duración', width: 120, sortable: true, align: 'right', value: (r) => (r.status === 'queued' ? 'En espera' : r.status === 'running' ? relativeTime(r.started_at).replace('hace', 'lleva') : formatDuration(r.duration_ms)) },
    { key: 'fetched', title: 'Leídas', width: 100, sortable: true, align: 'right', value: (r) => formatNumber(r.fetched) },
    { key: 'inserted', title: 'Nuevas', width: 100, sortable: true, align: 'right', render: (r) => <Text variant="smallStrong" tone={r.inserted ? 'mint' : 'muted'}>{formatNumber(r.inserted)}</Text> },
    { key: 'updated', title: 'Actualizadas', width: 120, sortable: true, align: 'right', value: (r) => formatNumber(r.updated) },
    { key: 'skipped', title: 'Omitidas', width: 100, align: 'right', render: (r) => <Text variant="small" tone={r.skipped ? 'coral' : 'muted'}>{formatNumber(r.skipped)}</Text> },
    { key: 'deactivated', title: 'Desactivadas', width: 120, align: 'right', value: (r) => formatNumber(r.deactivated) },
    { key: 'error', title: 'Error', width: 280, render: (r) => <Text variant="caption" tone={r.error ? 'coral' : 'muted'} numberOfLines={2}>{r.error ?? '—'}</Text> },
  ];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1500} refreshing={overview.isRefetching} onRefresh={() => overview.refetch()}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ gap: 6, flex: 1, minWidth: 280 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text variant="h1">Ingesta de descuentos</Text>
            {o ? <Badge label={o.settings.paused ? 'Sincronización pausada' : o.scheduler.active ? 'Sincronización activa' : 'Programador detenido'} tone={o.settings.paused ? 'coin' : o.scheduler.active ? 'mint' : 'coral'} icon={o.settings.paused ? Pause : o.scheduler.active ? CheckCircle2 : XCircle} /> : null}
          </View>
          <Text tone="soft">
            La API importa los beneficios de cada fuente según su frecuencia. {o?.scheduler.current?.length ? `Ahora: ${o.scheduler.current.map((id) => sourceName.get(id) ?? id).join(', ')}.` : ''}
            {o?.scheduler.queued.length ? ` En cola: ${o.scheduler.queued.length}.` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={o?.settings.paused ? Play : Pause} label={o?.settings.paused ? 'Reanudar' : 'Pausar'} loading={updateSettings.isPending} disabled={!o} onPress={togglePause} />
          <Button variant="coin" icon={PlayCircle} label="Ejecutar todas ahora" loading={run.isPending && run.variables === 'all'} disabled={!o} onPress={() => runNow('all', 'Todas')} />
        </View>
      </View>

      {o && !o.scheduler.browserEnabled ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: radius.lg, backgroundColor: colors.skySoft }}>
          <Monitor size={20} color={colors.sky} />
          <Text variant="small" style={{ flex: 1 }}>
            Las fuentes marcadas con “Navegador” se omiten: falta Chromium en la API. Corre <Text variant="smallStrong">npx playwright install chromium</Text> en apps/api (la imagen Docker ya lo trae) o revisa que INGEST_BROWSER no esté en false.
          </Text>
        </View>
      ) : null}

      {/* KPIs 24 h */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[
          { label: 'Ejecuciones (24 h)', value: o?.totals24h.runs },
          { label: 'Fallidas', value: o?.totals24h.failed, tone: o?.totals24h.failed ? 'coral' : undefined },
          { label: 'Ofertas leídas', value: o?.totals24h.fetched },
          { label: 'Nuevas', value: o?.totals24h.inserted, tone: 'mint' },
          { label: 'Actualizadas', value: o?.totals24h.updated },
          { label: 'Desactivadas', value: o?.totals24h.deactivated },
        ].map((k) => (
          <View key={k.label} style={{ flexGrow: 1, minWidth: 150, width: isDesktop ? '15%' : '30%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 }}>
            {overview.isLoading ? <Skeleton width={60} height={28} /> : <Text variant="h2" tone={(k.tone as 'mint' | 'coral' | undefined) ?? 'ink'}>{formatNumber(k.value ?? 0)}</Text>}
            <Text variant="caption" tone="soft">
              {k.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Locales en el mapa */}
      <Panel title="Locales en el mapa">
        {(() => {
          const g = o?.locations;
          const m = g?.merchants ?? {};
          const l = g?.locations ?? {};
          const totalMerchants = (m.pending ?? 0) + (m.done ?? 0) + (m.none ?? 0) + (m.error ?? 0);
          const totalLocations = (l.manual ?? 0) + (l.address ?? 0) + (l.osm ?? 0);
          const w = g?.worker;
          const status = !w ? null : !w.enabled ? 'Desactivado (GEOCODE_ENABLED=false)' : !w.active ? 'Detenido' : w.pausedUntil ? `En pausa: OpenStreetMap limitó las consultas; se reanuda el ${formatDateTime(w.pausedUntil)}` : w.current ? `Buscando: ${w.current}` : w.idleUntil ? 'Al día; revisa la cola cada minuto' : 'Activo';
          return (
            <View style={{ gap: 12 }}>
              <Text variant="small" tone="soft">
                Ubica las sucursales de cada comercio con OpenStreetMap en segundo plano (1 consulta por segundo): geocodifica las direcciones que traen las fuentes y busca locales por nombre.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <MapPin size={18} color={colors.sky} />
                <Text variant="small" style={{ flex: 1 }}>
                  {status ?? '—'}
                  {w?.processed ? ` · ${formatNumber(w.processed)} comercios desde el último arranque` : ''}
                </Text>
                {m.pending ? <Badge label={`${formatNumber(m.pending)} en cola`} tone="sky" icon={Loader2} /> : <Badge label="Cola vacía" tone="mint" icon={CheckCircle2} />}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { label: 'Locales ubicados', value: totalLocations, tone: 'mint' as const },
                  { label: 'Comercios con locales', value: g?.merchants_with_locations ?? 0 },
                  { label: 'Sin resultado en OSM', value: m.none ?? 0 },
                  { label: 'Con error', value: m.error ?? 0, tone: m.error ? ('coral' as const) : undefined },
                  { label: 'Direcciones por geocodificar', value: g?.addresses?.pending ?? 0 },
                  { label: 'Comercios en total', value: totalMerchants },
                ].map((k) => (
                  <View key={k.label} style={{ flexGrow: 1, minWidth: 150, width: isDesktop ? '15%' : '30%', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, gap: 2 }}>
                    {overview.isLoading ? <Skeleton width={60} height={24} /> : <Text variant="h3" tone={k.tone ?? 'ink'}>{formatNumber(k.value)}</Text>}
                    <Text variant="caption" tone="soft">
                      {k.label}
                    </Text>
                  </View>
                ))}
              </View>
              {w?.lastError ? (
                <Text variant="caption" tone="coral" numberOfLines={2}>
                  Último error: {w.lastError}
                </Text>
              ) : null}
            </View>
          );
        })()}
      </Panel>

      {/* Configuración general */}
      <Panel title="Configuración general">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <View style={{ width: 260 }}>
            <FrequencyPicker label="Frecuencia para todas las fuentes" value={bulkInterval} onChange={setBulkInterval} />
          </View>
          <Button
            variant="secondary"
            label="Aplicar a todas"
            loading={updateAll.isPending}
            onPress={async () => {
              if (!(await dialog.confirm({ title: 'Cambiar la frecuencia de todas las fuentes', message: `Todas pasarán a “${describeFrequency(bulkInterval).toLowerCase()}”. Puedes ajustar cada una después.`, confirmLabel: 'Aplicar' }))) return;
              const r = await updateAll.mutateAsync({ interval_minutes: bulkInterval });
              await updateSettings.mutateAsync({ default_interval_minutes: bulkInterval });
              toast.show({ kind: 'success', title: `${r.updated} fuentes actualizadas` });
            }}
          />
          <Input kind="number" label="Páginas máx. por fuente" placeholder={String(o?.settings.max_pages ?? 30)} value={maxPages} onChangeText={setMaxPages} containerStyle={{ width: 190 }} maxLength={3} />
          <Button
            variant="ghost"
            label="Guardar páginas"
            disabled={!maxPages}
            onPress={async () => {
              const n = Math.max(1, Math.min(100, Number(maxPages)));
              await updateSettings.mutateAsync({ max_pages: n });
              setMaxPages('');
              toast.show({ kind: 'success', title: `Hasta ${n} páginas por fuente` });
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
            <Button variant="ghost" size="sm" label="Activar todas" onPress={() => updateAll.mutate({ enabled: true })} />
            <Button variant="ghost" size="sm" label="Desactivar todas" onPress={() => updateAll.mutate({ enabled: false })} />
          </View>
        </View>
      </Panel>

      {/* Fuentes */}
      <Text variant="h3">Fuentes ({o?.sources.length ?? '…'})</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
        {overview.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ width: isDesktop ? '50%' : '100%', padding: 6 }}>
                <Skeleton height={170} radius={20} />
              </View>
            ))
          : (o?.sources ?? []).map((s) => (
              <View key={s.id} style={{ width: isDesktop ? '50%' : '100%', padding: 6 }}>
                <SourceCard
                  s={s}
                  paused={!!o?.settings.paused}
                  provider={providerOf(s.providerSlug)}
                  browserEnabled={!!o?.scheduler.browserEnabled}
                  queued={!!o?.scheduler.queued.includes(s.id)}
                  onRun={() => runNow(s.id, s.name)}
                  onHistory={() => {
                    setSource(s.id);
                    t.setPage(1);
                  }}
                  onOpenRun={setRunId}
                />
              </View>
            ))}
      </View>

      {/* Historial */}
      <Text variant="h3">Historial de ejecuciones</Text>
      <Text variant="small" tone="soft" style={{ marginTop: -8 }}>
        {latest ? 'Mostrando solo la ejecución más reciente de cada fuente.' : 'Todas las ejecuciones, de la más reciente a la más antigua.'}
      </Text>
      <DataTable
        columns={columns}
        rows={runs.data?.data ?? []}
        rowKey={(r) => r.id}
        loading={runs.isLoading}
        total={runs.data?.total ?? 0}
        page={t.page}
        pageSize={t.pageSize}
        onPageChange={t.setPage}
        onPageSizeChange={t.setPageSize}
        sort={t.sort}
        onSortChange={t.setSort}
        onRowPress={(r) => setRunId(r.id)}
        emptyTitle="Sin ejecuciones"
        emptyMessage="Cuando una fuente se ejecute aparecerá aquí."
        toolbar={
          <>
            <Chip
              label="Solo la última por fuente"
              icon={ListFilter}
              selected={latest}
              onPress={() => {
                setLatest((v) => !v);
                t.setPage(1);
              }}
            />
            <View style={{ width: 230 }}>
              <Select placeholder="Todas las fuentes" clearable value={source} onChange={(v) => { setSource((v as string) ?? null); t.setPage(1); }} options={(o?.sources ?? []).map((s) => ({ value: s.id, label: s.name }))} />
            </View>
            <View style={{ width: 190 }}>
              <Select placeholder="Cualquier estado" clearable value={status} onChange={(v) => { setStatus((v as string) ?? null); t.setPage(1); }} options={(Object.keys(STATUS) as RunStatus[]).map((k) => ({ value: k, label: STATUS[k].label }))} />
            </View>
            <View style={{ width: 170 }}>
              <Select placeholder="Cualquier origen" clearable value={trigger} onChange={(v) => { setTrigger((v as string) ?? null); t.setPage(1); }} options={Object.entries(TRIGGER).map(([value, label]) => ({ value, label }))} />
            </View>
            <Button variant="ghost" icon={RefreshCw} label="Actualizar" onPress={() => { runs.refetch(); overview.refetch(); }} />
          </>
        }
      />

      <RunDetail id={runId} onClose={() => setRunId(null)} name={(id) => sourceName.get(id) ?? id} />
    </Screen>
  );
}

function StatusBadge({ status }: { status: RunStatus }) {
  const s = STATUS[status] ?? STATUS.error;
  return <Badge label={s.label} tone={s.tone} icon={s.icon} />;
}

function SourceCard({ s, paused, provider, browserEnabled, queued, onRun, onHistory, onOpenRun }: { s: IngestionSource; paused: boolean; provider?: { domain: string | null; logo_url: string | null; brand_color: string | null }; browserEnabled: boolean; queued: boolean; onRun: () => void; onHistory: () => void; onOpenRun: (id: string) => void }) {
  const { colors } = useTheme();
  const update = useUpdateSchedule();
  const toast = useToast();
  const sch = s.schedule;
  const last = s.lastRun;
  const running = !!s.running || queued;
  // En cola: la fila ya existe pero el programador todavía no la toma (o aún no se registra la fila).
  const waiting = s.running ? s.running.status === 'queued' : queued;
  const blocked = s.needsBrowser && !browserEnabled;
  const nextLabel = !sch ? '—' : !sch.enabled ? 'Desactivada' : paused ? 'En pausa' : relativeTime(sch.next_run_at);
  const set = async (patch: { enabled?: boolean; interval_minutes?: number }) => {
    try {
      await update.mutateAsync({ source: s.id, ...patch });
      toast.show({ kind: 'success', title: s.name, message: patch.enabled === false ? 'Sincronización desactivada' : patch.enabled ? 'Sincronización activada' : `Ahora: ${describeFrequency(patch.interval_minutes!).toLowerCase()}` });
    } catch (e) {
      toast.show({ kind: 'error', title: 'No se pudo guardar', message: (e as Error).message });
    }
  };
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: running ? colors.sky : colors.line, padding: 16, gap: 12, opacity: sch?.enabled === false ? 0.7 : 1 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BrandLogo name={s.name} domain={provider?.domain} logoUrl={provider?.logo_url} color={provider?.brand_color} size={42} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text variant="title" numberOfLines={1}>
              {s.name}
            </Text>
            {s.needsBrowser ? <Badge label="Navegador" tone={blocked ? 'neutral' : 'sky'} icon={Monitor} /> : null}
          </View>
          <Text variant="caption" tone="soft" numberOfLines={2}>
            {s.description}
          </Text>
        </View>
        <Switch value={!!sch?.enabled} onChange={(enabled) => set({ enabled })} disabled={update.isPending} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <View style={{ width: 210 }}>
          <FrequencyPicker value={sch?.interval_minutes ?? 1440} onChange={(interval_minutes) => set({ interval_minutes })} disabled={!sch || update.isPending} />
        </View>
        <View style={{ gap: 2, minWidth: 110 }}>
          <Text variant="caption" tone="muted">
            Próxima
          </Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Clock size={13} color={colors.inkSoft} />
            <Text variant="smallStrong">{nextLabel}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
          <Button size="sm" variant="ghost" label="Historial" onPress={onHistory} />
          <Button size="sm" icon={Play} label={waiting ? 'En cola' : running ? 'En curso' : 'Ejecutar'} loading={running} disabled={running} onPress={onRun} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'center' }}>
        {last ? (
          <>
            <StatusBadge status={waiting ? 'queued' : running ? 'running' : last.status} />
            <Text variant="caption" tone="soft">
              {waiting ? `En cola ${relativeTime(s.running?.started_at ?? new Date().toISOString())}` : running ? `Iniciada ${relativeTime(s.running?.started_at ?? last.started_at)}` : `Última ${relativeTime(last.finished_at ?? last.started_at)} · ${formatDuration(last.duration_ms)}`}
            </Text>
            {!running ? (
              <Text variant="caption">
                {formatNumber(last.fetched)} leídas · <Text variant="caption" tone="mint">{formatNumber(last.inserted)} nuevas</Text> · {formatNumber(last.updated)} actualizadas
              </Text>
            ) : null}
            {last.error && !running ? (
              <Button size="sm" variant="ghost" label="Ver error" onPress={() => onOpenRun(last.id)} />
            ) : null}
          </>
        ) : (
          <Text variant="caption" tone="muted">
            {waiting ? 'En cola para su primera ejecución…' : running ? 'Ejecutándose por primera vez…' : 'Aún no se ha ejecutado.'}
          </Text>
        )}
        {s.summary7d ? (
          <Text variant="caption" tone="muted" style={{ marginLeft: 'auto' }}>
            {formatNumber(s.summary7d.active_discounts)} activas · 7 d: {s.summary7d.runs} ejec.{s.summary7d.failed ? `, ${s.summary7d.failed} fallidas` : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function RunDetail({ id, onClose, name }: { id: string | null; onClose: () => void; name: (s: string) => string }) {
  const { colors } = useTheme();
  const q = useIngestionRun(id);
  const r = q.data;
  const stats = r
    ? [
        ['Leídas', r.fetched],
        ['Guardadas', r.upserted],
        ['Nuevas', r.inserted],
        ['Actualizadas', r.updated],
        ['Omitidas', r.skipped],
        ['Desactivadas', r.deactivated],
        ['Páginas', r.pages],
      ]
    : [];
  return (
    <Modal visible={!!id} onClose={onClose} title={r ? name(r.source) : 'Ejecución'} subtitle={r ? `${TRIGGER[r.trigger] ?? r.trigger} · ${formatDateTime(r.started_at)}${r.actor?.display_name ? ` · ${r.actor.display_name}` : ''}` : undefined} width={640}>
      {q.isLoading || !r ? (
        <Skeleton height={160} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <StatusBadge status={r.status} />
            <Text variant="small" tone="soft">
              Duración: {r.status === 'queued' ? 'esperando turno…' : r.status === 'running' ? 'en curso…' : formatDuration(r.duration_ms)}
              {r.finished_at ? ` · terminó ${formatDateTime(r.finished_at)}` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {stats.map(([label, value]) => (
              <View key={label as string} style={{ minWidth: 110, flexGrow: 1, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}>
                <Text variant="h3" tone={label === 'Nuevas' && Number(value) > 0 ? 'mint' : label === 'Omitidas' && Number(value) > 0 ? 'coral' : 'ink'}>
                  {formatNumber(Number(value))}
                </Text>
                <Text variant="caption" tone="soft">
                  {label}
                </Text>
              </View>
            ))}
          </View>
          {r.error ? (
            <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: colors.coralSoft, gap: 4 }}>
              <Text variant="smallStrong" tone="coral">
                Error principal
              </Text>
              <Text variant="small">{r.error}</Text>
            </View>
          ) : null}
          {(r.errors?.length ?? 0) > 0 ? (
            <View style={{ gap: 6 }}>
              <Text variant="smallStrong" tone="soft">
                Detalle ({r.errors!.length}
                {r.errors!.length >= 50 ? '+' : ''})
              </Text>
              {r.errors!.map((e, i) => (
                <Text key={i} variant="caption" tone="soft" style={{ fontFamily: 'Courier', padding: 8, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }}>
                  {e}
                </Text>
              ))}
            </View>
          ) : r.status !== 'running' && r.status !== 'queued' ? (
            <Text variant="small" tone="mint">
              Sin errores en esta ejecución.
            </Text>
          ) : null}
        </>
      )}
    </Modal>
  );
}
