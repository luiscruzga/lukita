import { useState } from 'react';
import { View } from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useAdminDiscounts, useDeleteDiscount, useProviders } from '@/hooks/queries';
import { useTableState } from '@/hooks/useTableState';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Chip';
import { Button, IconButton } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { DiscountForm } from '@/components/discounts/DiscountForm';
import { discountHeadline } from '@/components/discounts/discountFormat';
import { DISCOUNT_CATEGORIES, categoryName } from '@/constants/categories';
import { describeDays, formatDate } from '@/lib/dates';
import type { Discount } from '@/types/domain';

export default function AdminDiscounts() {
  return (
    <RoleGate roles={['admin', 'moderator', 'partner']}>
      <Discounts />
    </RoleGate>
  );
}

function Discounts() {
  const t = useTableState({ key: 'updated_at', dir: 'desc' });
  const [providerId, setProviderId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const q = useAdminDiscounts({ ...t.params, providerId, category, status });
  const providers = useProviders({ pageSize: 100 });
  const del = useDeleteDiscount();
  const dialog = useDialog();
  const toast = useToast();
  const [editing, setEditing] = useState<Discount | null>(null);
  const [open, setOpen] = useState(false);

  const columns: Column<Discount>[] = [
    {
      key: 'title',
      title: 'Descuento',
      width: 320,
      sortable: true,
      render: (d) => (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <BrandLogo name={d.merchant?.name ?? d.title} domain={d.merchant?.domain} logoUrl={d.merchant?.logo_url} color={d.merchant?.brand_color} size={30} />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong" numberOfLines={1}>
              {d.merchant?.name ?? '—'}
            </Text>
            <Text variant="caption" tone="soft" numberOfLines={1}>
              {d.title}
            </Text>
          </View>
        </View>
      ),
    },
    { key: 'value', title: 'Valor', width: 100, sortable: true, align: 'right', render: (d) => <Text variant="bodyStrong">{discountHeadline(d.discount_type, d.value).big}</Text> },
    { key: 'provider', title: 'Proveedor', width: 190, render: (d) => <Text variant="small" numberOfLines={1}>{d.provider.name}</Text> },
    { key: 'category', title: 'Rubro', width: 160, sortable: true, value: (d) => categoryName(d.category) },
    { key: 'days', title: 'Días', width: 170, value: (d) => describeDays(d.days_of_week) },
    { key: 'valid_to', title: 'Vence', width: 140, sortable: true, value: (d) => (d.valid_to ? formatDate(d.valid_to) : 'Sin fecha') },
    { key: 'is_active', title: 'Estado', width: 120, sortable: true, render: (d) => <Badge label={d.is_active ? 'Activo' : 'Inactivo'} tone={d.is_active ? 'mint' : 'neutral'} /> },
    {
      key: 'actions',
      title: '',
      width: 110,
      render: (d) => (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <IconButton icon={Pencil} label="Editar" size={32} onPress={() => { setEditing(d); setOpen(true); }} />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            size={32}
            onPress={async () => {
              if (!(await dialog.confirm({ title: 'Eliminar descuento', message: `“${d.title}” dejará de existir para todos los usuarios.`, tone: 'danger', confirmLabel: 'Eliminar' }))) return;
              await del.mutateAsync(d.id);
              toast.show({ kind: 'success', title: 'Descuento eliminado' });
            }}
          />
        </View>
      ),
    },
  ];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1500}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <Text variant="h1">Descuentos</Text>
        <Button icon={Plus} label="Nuevo descuento" onPress={() => { setEditing(null); setOpen(true); }} />
      </View>
      <DataTable
        columns={columns}
        rows={q.data?.data ?? []}
        rowKey={(d) => d.id}
        loading={q.isLoading}
        total={q.data?.total ?? 0}
        page={t.page}
        pageSize={t.pageSize}
        onPageChange={t.setPage}
        onPageSizeChange={t.setPageSize}
        sort={t.sort}
        onSortChange={t.setSort}
        onRowPress={(d) => { setEditing(d); setOpen(true); }}
        toolbar={
          <>
            <Input kind="search" placeholder="Buscar título o comercio" value={t.search} onChangeText={t.setSearch} containerStyle={{ flex: 1, minWidth: 220 }} />
            <View style={{ width: 220 }}>
              <Select placeholder="Todos los proveedores" clearable value={providerId} onChange={(v) => { setProviderId((v as string) ?? null); t.setPage(1); }} options={(providers.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} />
            </View>
            <View style={{ width: 200 }}>
              <Select placeholder="Todos los rubros" clearable value={category} onChange={(v) => { setCategory((v as string) ?? null); t.setPage(1); }} options={DISCOUNT_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))} />
            </View>
            <View style={{ width: 180 }}>
              <Select placeholder="Cualquier estado" clearable value={status} onChange={(v) => { setStatus((v as string) ?? null); t.setPage(1); }} options={[{ value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }, { value: 'expired', label: 'Vencidos' }]} />
            </View>
          </>
        }
      />
      <DiscountForm visible={open} onClose={() => setOpen(false)} initial={editing} />
    </Screen>
  );
}
