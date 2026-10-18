import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAdminMerchants } from '@/hooks/queries';
import { useTableState } from '@/hooks/useTableState';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { LocationsStatusBadge, LOCATIONS_STATUS } from '@/components/admin/LocationsStatus';
import { DISCOUNT_CATEGORIES, categoryName } from '@/constants/categories';
import { formatNumber } from '@/lib/format';
import { relativeTime } from '@/lib/dates';
import type { AdminMerchant, LocationsStatus } from '@/types/domain';

export default function AdminLocales() {
  return (
    <RoleGate roles={['admin']}>
      <Locales />
    </RoleGate>
  );
}

function Locales() {
  const t = useTableState({ key: 'locations', dir: 'desc' });
  const [status, setStatus] = useState<LocationsStatus | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [orphans, setOrphans] = useState(false);
  const q = useAdminMerchants({ ...t.params, status, category, orphans });

  const columns: Column<AdminMerchant>[] = [
    {
      key: 'name',
      title: 'Comercio',
      width: 300,
      sortable: true,
      render: (m) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandLogo name={m.name} domain={m.domain} logoUrl={m.logo_url} color={m.brand_color} size={32} />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong" numberOfLines={1}>
              {m.name}
            </Text>
            <Text variant="caption" tone="soft" numberOfLines={1}>
              {categoryName(m.category)}
            </Text>
          </View>
        </View>
      ),
    },
    { key: 'locations', title: 'Locales', width: 110, sortable: true, align: 'right', render: (m) => <Text variant="smallStrong" tone={m.locations ? 'mint' : 'muted'}>{formatNumber(m.locations)}</Text> },
    { key: 'active_discounts', title: 'Descuentos activos', width: 160, sortable: true, align: 'right', value: (m) => formatNumber(m.active_discounts) },
    { key: 'locations_status', title: 'Búsqueda', width: 170, render: (m) => <LocationsStatusBadge status={m.locations_status} /> },
    { key: 'pending_addresses', title: 'Direcciones en cola', width: 160, align: 'right', render: (m) => <Text variant="small" tone={m.pending_addresses ? 'ink' : 'muted'}>{formatNumber(m.pending_addresses)}</Text> },
    { key: 'locations_checked_at', title: 'Revisado', width: 150, sortable: true, value: (m) => (m.locations_checked_at ? relativeTime(m.locations_checked_at) : '—') },
  ];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1400}>
      <Text variant="h1">Locales</Text>
      <Text tone="soft">Comercios con sus sucursales ubicadas en OpenStreetMap. Abre uno para ver todos sus locales en el mapa.</Text>
      <DataTable
        columns={columns}
        rows={q.data?.data ?? []}
        rowKey={(m) => m.id}
        loading={q.isLoading}
        total={q.data?.total ?? 0}
        page={t.page}
        pageSize={t.pageSize}
        onPageChange={t.setPage}
        onPageSizeChange={t.setPageSize}
        sort={t.sort}
        onSortChange={t.setSort}
        onRowPress={(m) => router.push(`/admin/locales/${m.id}` as never)}
        emptyTitle="Sin comercios"
        emptyMessage="Prueba con otro nombre o quita los filtros."
        toolbar={
          <>
            <Input kind="search" placeholder="Buscar comercio (ej: Copec)" value={t.search} onChangeText={t.setSearch} containerStyle={{ flex: 1, minWidth: 220 }} />
            <View style={{ width: 210 }}>
              <Select
                placeholder="Cualquier estado"
                clearable
                value={status}
                onChange={(v) => {
                  setStatus((v as LocationsStatus) ?? null);
                  t.setPage(1);
                }}
                options={(Object.keys(LOCATIONS_STATUS) as LocationsStatus[]).map((k) => ({ value: k, label: LOCATIONS_STATUS[k].label }))}
              />
            </View>
            <View style={{ width: 210 }}>
              <Select
                placeholder="Todos los rubros"
                clearable
                value={category}
                onChange={(v) => {
                  setCategory((v as string) ?? null);
                  t.setPage(1);
                }}
                options={DISCOUNT_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
              />
            </View>
            <Chip
              label="Incluir sin descuentos activos"
              selected={orphans}
              onPress={() => {
                setOrphans((v) => !v);
                t.setPage(1);
              }}
            />
          </>
        }
      />
    </Screen>
  );
}
