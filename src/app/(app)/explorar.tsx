import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SlidersHorizontal, SearchX } from 'lucide-react-native';
import { useAccounts, useInfiniteDiscounts, useProviders, type DiscountFilters } from '@/hooks/queries';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { DatePicker } from '@/components/ui/DatePicker';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryChips } from '@/components/discounts/CategoryChips';
import { TicketGrid } from '@/components/discounts/TicketGrid';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { DISCOUNT_TYPE_LABEL } from '@/constants/categories';
import { WEEKDAYS_SHORT } from '@/lib/dates';
import { useDebounced } from '@/hooks/useDebounced';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function Explorar() {
  const accounts = useAccounts();
  const [q, setQ] = useState('');
  const query = useDebounced(q);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<DiscountFilters>({ mine: true, sort: 'relevance', pageSize: 18 });
  useEffect(() => {
    if (accounts.isFetched && !accounts.data?.length) setF((x) => ({ ...x, mine: false }));
  }, [accounts.isFetched, accounts.data?.length]);
  const providers = useProviders({ pageSize: 100 });
  const filters = useMemo(() => ({ ...f, q: query || undefined }), [f, query]);
  const list = useInfiniteDiscounts(filters, accounts.isFetched);
  const items = list.data?.pages.flatMap((p) => p.data) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const active = [f.day !== undefined && f.day !== null, !!f.date, !!f.providerIds?.length, !!f.channel, !!f.type, !!f.minValue].filter(Boolean).length;

  return (
    <Screen topInset={false} refreshing={list.isRefetching} onRefresh={() => list.refetch()} contentStyle={{ gap: 16 }}>
      <Text variant="h1">Explorar</Text>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Input kind="search" placeholder="Comercio, rubro o beneficio (ej: sushi, bencina)" value={q} onChangeText={setQ} containerStyle={{ flex: 1 }} />
        <Button variant={active ? 'primary' : 'secondary'} icon={SlidersHorizontal} label={active ? `Filtros · ${active}` : 'Filtros'} onPress={() => setOpen(true)} />
      </View>
      <CategoryChips value={f.category ?? null} onChange={(category) => setF((x) => ({ ...x, category }))} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip size="sm" label="Solo mis cuentas" selected={!!f.mine} onPress={() => setF((x) => ({ ...x, mine: !x.mine }))} />
          {DAY_ORDER.map((d) => (
            <Chip key={d} size="sm" label={WEEKDAYS_SHORT[d]} selected={f.day === d} onPress={() => setF((x) => ({ ...x, day: x.day === d ? null : d, date: null }))} />
          ))}
        </View>
        <Text variant="small" tone="soft">
          {list.isLoading ? 'Buscando…' : `${total} resultados`}
        </Text>
      </View>
      {list.isLoading ? (
        <ListSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState icon={SearchX} title="Sin coincidencias" message="Prueba con otra palabra, quita filtros o desactiva “Solo mis cuentas”." action={<Button variant="secondary" label="Limpiar filtros" onPress={() => { setQ(''); setF({ mine: false, sort: 'relevance', pageSize: 18 }); }} />} />
      ) : (
        <>
          <TicketGrid items={items} />
          {list.hasNextPage ? <Button variant="secondary" label="Cargar más" loading={list.isFetchingNextPage} onPress={() => list.fetchNextPage()} style={{ alignSelf: 'center' }} /> : null}
        </>
      )}

      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        subtitle="Combina día, proveedor y tipo de beneficio"
        footer={
          <>
            <Button variant="ghost" label="Limpiar" onPress={() => setF({ mine: f.mine, sort: 'relevance', pageSize: 18 })} />
            <Button label={`Ver ${total} resultados`} onPress={() => setOpen(false)} />
          </>
        }
      >
        <Switch label="Solo mis cuentas" description="Muestra únicamente beneficios de las cuentas que agregaste" value={!!f.mine} onChange={(mine) => setF((x) => ({ ...x, mine }))} />
        <Text variant="smallStrong" tone="soft">
          Ordenar por
        </Text>
        <Segmented
          value={f.sort ?? 'relevance'}
          onChange={(sort) => setF((x) => ({ ...x, sort }))}
          options={[
            { value: 'relevance', label: 'Relevancia' },
            { value: 'value', label: 'Mayor dcto.' },
            { value: 'ending', label: 'Por vencer' },
            { value: 'newest', label: 'Nuevos' },
          ]}
        />
        <DatePicker label="Válido en una fecha" value={f.date ?? null} onChange={(date) => setF((x) => ({ ...x, date, day: null }))} clearable />
        <Select
          label="Proveedores"
          multiple
          placeholder="Todos"
          value={f.providerIds ?? []}
          onChange={(v) => setF((x) => ({ ...x, providerIds: (v as string[]) ?? [] }))}
          options={(providers.data?.data ?? []).map((p) => ({ value: p.id, label: p.name, leading: <BrandLogo name={p.name} domain={p.domain} logoUrl={p.logo_url} color={p.brand_color} size={28} /> }))}
        />
        <Select label="Tipo de beneficio" placeholder="Cualquiera" clearable value={f.type ?? null} onChange={(v) => setF((x) => ({ ...x, type: (v as string) ?? null }))} options={Object.entries(DISCOUNT_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
        <Select
          label="Canal"
          placeholder="Presencial y online"
          clearable
          value={f.channel ?? null}
          onChange={(v) => setF((x) => ({ ...x, channel: (v as string) ?? null }))}
          options={[
            { value: 'in_store', label: 'Presencial' },
            { value: 'online', label: 'Online' },
          ]}
        />
        <Input kind="number" label="Descuento mínimo (%)" placeholder="Ej: 20" value={f.minValue ? String(f.minValue) : ''} onChangeText={(v) => setF((x) => ({ ...x, minValue: v ? Math.min(100, Number(v)) : null }))} maxLength={3} />
      </Modal>
    </Screen>
  );
}
