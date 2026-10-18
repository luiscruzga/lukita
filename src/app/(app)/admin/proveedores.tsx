import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import { useAdminProviders, useCategories, useSaveProvider } from '@/hooks/queries';
import { useTableState } from '@/hooks/useTableState';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Chip';
import { Button, IconButton } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/brand/BrandLogo';
import type { Provider } from '@/types/domain';

export default function AdminProviders() {
  return (
    <RoleGate roles={['admin']}>
      <Providers />
    </RoleGate>
  );
}

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function Providers() {
  const t = useTableState({ key: 'name', dir: 'asc' });
  const [category, setCategory] = useState<string | null>(null);
  const q = useAdminProviders({ ...t.params, category });
  const cats = useCategories();
  const [editing, setEditing] = useState<Partial<Provider> | null>(null);
  const catName = (id: string) => cats.data?.find((c) => c.id === id)?.name ?? id;

  const columns: Column<Provider>[] = [
    {
      key: 'name',
      title: 'Proveedor',
      width: 260,
      sortable: true,
      render: (p) => (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <BrandLogo name={p.name} domain={p.domain} logoUrl={p.logo_url} color={p.brand_color} size={30} />
          <Text variant="smallStrong" numberOfLines={1} style={{ flex: 1 }}>
            {p.name}
          </Text>
        </View>
      ),
    },
    { key: 'category_id', title: 'Categoría', width: 190, sortable: true, value: (p) => catName(p.category_id) },
    { key: 'domain', title: 'Dominio', width: 190, sortable: true },
    { key: 'discount_count', title: 'Descuentos', width: 120, sortable: true, align: 'right' },
    { key: 'brand_color', title: 'Color', width: 110, render: (p) => <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: p.brand_color ?? '#999' }} /><Text variant="caption">{p.brand_color}</Text></View> },
    { key: 'is_active', title: 'Estado', width: 110, sortable: true, render: (p) => <Badge label={p.is_active ? 'Activo' : 'Oculto'} tone={p.is_active ? 'mint' : 'neutral'} /> },
    { key: 'actions', title: '', width: 70, render: (p) => <IconButton icon={Pencil} label="Editar" size={32} onPress={() => setEditing(p)} /> },
  ];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1400}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <Text variant="h1">Proveedores</Text>
        <Button icon={Plus} label="Nuevo proveedor" onPress={() => setEditing({ is_active: true, category_id: 'bank' })} />
      </View>
      <DataTable
        columns={columns}
        rows={q.data?.data ?? []}
        rowKey={(p) => p.id}
        loading={q.isLoading}
        total={q.data?.total ?? 0}
        page={t.page}
        pageSize={t.pageSize}
        onPageChange={t.setPage}
        onPageSizeChange={t.setPageSize}
        sort={t.sort}
        onSortChange={t.setSort}
        onRowPress={setEditing}
        toolbar={
          <>
            <Input kind="search" placeholder="Buscar proveedor" value={t.search} onChangeText={t.setSearch} containerStyle={{ flex: 1, minWidth: 220 }} />
            <View style={{ width: 240 }}>
              <Select placeholder="Todas las categorías" clearable value={category} onChange={(v) => { setCategory((v as string) ?? null); t.setPage(1); }} options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            </View>
          </>
        }
      />
      <ProviderModal provider={editing} onClose={() => setEditing(null)} categories={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
    </Screen>
  );
}

function ProviderModal({ provider, onClose, categories }: { provider: Partial<Provider> | null; onClose: () => void; categories: { value: string; label: string }[] }) {
  const save = useSaveProvider();
  const toast = useToast();
  const [p, setP] = useState<Partial<Provider>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setP(provider ?? {});
    setError(null);
  }, [provider]);
  const submit = async () => {
    if (!p.name?.trim()) return setError('El nombre es obligatorio.');
    if (p.brand_color && !/^#[0-9A-Fa-f]{6}$/.test(p.brand_color)) return setError('El color debe ser hexadecimal, ej: #2B1FA8');
    if (p.domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(p.domain)) return setError('El dominio no es válido (ej: bancochile.cl).');
    try {
      await save.mutateAsync({ id: p.id, name: p.name.trim(), slug: p.slug || slugify(p.name), category_id: p.category_id, domain: p.domain || null, brand_color: p.brand_color || null, website: p.website || null, logo_url: p.logo_url || null, description: p.description || null, is_active: p.is_active ?? true });
      toast.show({ kind: 'success', title: p.id ? 'Proveedor actualizado' : 'Proveedor creado' });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Modal visible={!!provider} onClose={onClose} title={p.id ? 'Editar proveedor' : 'Nuevo proveedor'} width={560} footer={<Button label="Guardar" loading={save.isPending} onPress={submit} />}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <BrandLogo name={p.name ?? '?'} domain={p.domain} logoUrl={p.logo_url} color={p.brand_color} size={56} />
        <Input kind="text" label="Nombre" value={p.name ?? ''} onChangeText={(name) => setP((x) => ({ ...x, name }))} containerStyle={{ flex: 1 }} maxLength={80} />
      </View>
      <Select label="Categoría" value={p.category_id ?? null} onChange={(v) => setP((x) => ({ ...x, category_id: v as string }))} options={categories} />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Input kind="url" label="Dominio" placeholder="bancochile.cl" value={p.domain ?? ''} onChangeText={(domain) => setP((x) => ({ ...x, domain: domain.toLowerCase() }))} containerStyle={{ flex: 1, minWidth: 180 }} />
        <Input kind="text" label="Color de marca" placeholder="#2B1FA8" value={p.brand_color ?? ''} onChangeText={(brand_color) => setP((x) => ({ ...x, brand_color }))} autoCapitalize="characters" containerStyle={{ flex: 1, minWidth: 140 }} maxLength={7} />
      </View>
      <Input kind="url" label="Sitio de beneficios" placeholder="https://" value={p.website ?? ''} onChangeText={(website) => setP((x) => ({ ...x, website }))} />
      <Input kind="url" label="URL del logo (opcional)" placeholder="Si se deja vacío se usa el favicon del dominio" value={p.logo_url ?? ''} onChangeText={(logo_url) => setP((x) => ({ ...x, logo_url }))} />
      <Input kind="multiline" label="Descripción" value={p.description ?? ''} onChangeText={(description) => setP((x) => ({ ...x, description }))} maxLength={500} />
      <Switch label="Visible para los usuarios" value={p.is_active ?? true} onChange={(is_active) => setP((x) => ({ ...x, is_active }))} />
      {error ? (
        <Text variant="small" tone="coral">
          {error}
        </Text>
      ) : null}
    </Modal>
  );
}
