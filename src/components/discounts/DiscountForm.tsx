import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMerchants, useProviders, useSaveDiscount } from '@/hooks/queries';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Switch } from '../ui/Switch';
import { DatePicker, TimePicker } from '../ui/DatePicker';
import { Text } from '../ui/Text';
import { useToast } from '../ui/Toast';
import { BrandLogo } from '../brand/BrandLogo';
import { DISCOUNT_CATEGORIES, DISCOUNT_TYPE_LABEL } from '@/constants/categories';
import { WEEKDAYS_SHORT } from '@/lib/dates';
import type { Channel, Discount, DiscountType } from '@/types/domain';

interface FormState {
  provider_id: string | null;
  merchant_id: string | null;
  title: string;
  description: string;
  discount_type: DiscountType;
  value: string;
  cap_amount: string;
  min_purchase: string;
  days_of_week: number[];
  time_start: string | null;
  time_end: string | null;
  valid_from: string | null;
  valid_to: string | null;
  channel: Channel;
  category: string;
  terms: string;
  source_url: string;
  code: string;
  is_featured: boolean;
  is_active: boolean;
}

const EMPTY: FormState = { provider_id: null, merchant_id: null, title: '', description: '', discount_type: 'percent', value: '', cap_amount: '', min_purchase: '', days_of_week: [], time_start: null, time_end: null, valid_from: null, valid_to: null, channel: 'in_store', category: 'food', terms: '', source_url: '', code: '', is_featured: false, is_active: true };

/** Crear/editar descuento (admin, moderador o comercio aliado). Valida antes de enviar; la API vuelve a validar. */
export function DiscountForm({ visible, onClose, initial }: { visible: boolean; onClose: () => void; initial?: Discount | null }) {
  const toast = useToast();
  const save = useSaveDiscount();
  const [f, setF] = useState<FormState>(EMPTY);
  const [merchantQ, setMerchantQ] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global', string>>>({});
  const providers = useProviders({ pageSize: 100 });
  const merchants = useMerchants({ q: merchantQ || undefined, pageSize: 50 });

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setF(
      initial
        ? {
            provider_id: initial.provider.id,
            merchant_id: initial.merchant?.id ?? null,
            title: initial.title,
            description: initial.description ?? '',
            discount_type: initial.discount_type,
            value: initial.value?.toString() ?? '',
            cap_amount: initial.cap_amount?.toString() ?? '',
            min_purchase: initial.min_purchase?.toString() ?? '',
            days_of_week: initial.days_of_week ?? [],
            time_start: initial.time_start?.slice(0, 5) ?? null,
            time_end: initial.time_end?.slice(0, 5) ?? null,
            valid_from: initial.valid_from,
            valid_to: initial.valid_to,
            channel: initial.channel,
            category: initial.category,
            terms: initial.terms ?? '',
            source_url: initial.source_url ?? '',
            code: initial.code ?? '',
            is_featured: initial.is_featured,
            is_active: initial.is_active,
          }
        : EMPTY,
    );
  }, [visible, initial]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const num = (s: string) => (s ? Number(s) : null);

  const submit = async () => {
    const e: typeof errors = {};
    if (!f.provider_id) e.provider_id = 'Elige el proveedor (banco, caja, club…).';
    if (f.title.trim().length < 4) e.title = 'Escribe un título de al menos 4 caracteres.';
    if (['percent', 'cashback'].includes(f.discount_type) && (!num(f.value) || num(f.value)! > 100)) e.value = 'Un porcentaje entre 1 y 100.';
    if (f.valid_from && f.valid_to && f.valid_to < f.valid_from) e.valid_to = 'Debe ser posterior al inicio.';
    if (f.source_url && !/^https:\/\//.test(f.source_url)) e.source_url = 'Usa una URL https://';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await save.mutateAsync({
        id: initial?.id,
        provider_id: f.provider_id!,
        merchant_id: f.merchant_id,
        title: f.title.trim(),
        description: f.description.trim() || null,
        discount_type: f.discount_type,
        value: num(f.value),
        cap_amount: num(f.cap_amount),
        min_purchase: num(f.min_purchase),
        days_of_week: f.days_of_week.length ? f.days_of_week : null,
        time_start: f.time_start,
        time_end: f.time_end,
        valid_from: f.valid_from,
        valid_to: f.valid_to,
        channel: f.channel,
        category: f.category,
        terms: f.terms.trim() || null,
        source_url: f.source_url.trim() || null,
        code: f.code.trim() || null,
        is_featured: f.is_featured,
        is_active: f.is_active,
      });
      toast.show({ kind: 'success', title: initial ? 'Descuento actualizado' : 'Descuento creado' });
      onClose();
    } catch (err) {
      setErrors({ global: (err as Error).message });
    }
  };

  const half = { flex: 1, minWidth: 180 };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={initial ? 'Editar descuento' : 'Nuevo descuento'}
      width={720}
      footer={
        <>
          <Button variant="secondary" label="Cancelar" onPress={onClose} />
          <Button label={initial ? 'Guardar cambios' : 'Crear descuento'} loading={save.isPending} onPress={submit} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={half}>
          <Select
            label="Proveedor"
            value={f.provider_id}
            error={errors.provider_id}
            onChange={(v) => set('provider_id', v as string)}
            options={(providers.data?.data ?? []).map((p) => ({ value: p.id, label: p.name, leading: <BrandLogo name={p.name} domain={p.domain} logoUrl={p.logo_url} color={p.brand_color} size={28} /> }))}
          />
        </View>
        <View style={half}>
          <Select
            label="Comercio"
            placeholder="Sin comercio (beneficio general)"
            clearable
            value={f.merchant_id}
            onChange={(v) => set('merchant_id', (v as string) ?? null)}
            options={(merchants.data?.data ?? []).map((m) => ({ value: m.id, label: m.name, description: m.category, leading: <BrandLogo name={m.name} domain={m.domain} logoUrl={m.logo_url} color={m.brand_color} size={28} /> }))}
          />
          <Input kind="search" placeholder="Buscar comercio…" value={merchantQ} onChangeText={setMerchantQ} containerStyle={{ marginTop: 6 }} />
        </View>
      </View>
      <Input kind="text" label="Título" value={f.title} onChangeText={(v) => set('title', v)} error={errors.title} maxLength={140} placeholder="40% en sushi pagando con tarjeta de crédito" />
      <Input kind="multiline" label="Descripción" value={f.description} onChangeText={(v) => set('description', v)} maxLength={1000} />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={half}>
          <Select label="Tipo" value={f.discount_type} onChange={(v) => set('discount_type', v as DiscountType)} options={Object.entries(DISCOUNT_TYPE_LABEL).map(([value, label]) => ({ value: value as DiscountType, label }))} />
        </View>
        <Input kind={['percent', 'cashback'].includes(f.discount_type) ? 'number' : 'currency'} label={f.discount_type === 'installments' ? 'N° de cuotas' : f.discount_type === 'points' ? 'Multiplicador' : 'Valor'} value={f.value} onChangeText={(v) => set('value', v)} error={errors.value} containerStyle={half} maxLength={9} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Input kind="currency" label="Tope de descuento" value={f.cap_amount} onChangeText={(v) => set('cap_amount', v)} containerStyle={half} maxLength={9} placeholder="Sin tope" />
        <Input kind="currency" label="Compra mínima" value={f.min_purchase} onChangeText={(v) => set('min_purchase', v)} containerStyle={half} maxLength={9} placeholder="Sin mínimo" />
      </View>
      <Text variant="smallStrong" tone="soft">
        Días válidos (ninguno = todos)
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <Chip key={d} label={WEEKDAYS_SHORT[d]} selected={f.days_of_week.includes(d)} onPress={() => set('days_of_week', f.days_of_week.includes(d) ? f.days_of_week.filter((x) => x !== d) : [...f.days_of_week, d])} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={half}>
          <TimePicker label="Desde las" value={f.time_start} onChange={(v) => set('time_start', v)} clearable placeholder="Todo el día" />
        </View>
        <View style={half}>
          <TimePicker label="Hasta las" value={f.time_end} onChange={(v) => set('time_end', v)} clearable placeholder="Todo el día" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={half}>
          <DatePicker label="Vigente desde" value={f.valid_from} onChange={(v) => set('valid_from', v)} clearable />
        </View>
        <View style={half}>
          <DatePicker label="Vigente hasta" value={f.valid_to} onChange={(v) => set('valid_to', v)} min={f.valid_from ?? undefined} error={errors.valid_to} clearable />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={half}>
          <Select label="Rubro" value={f.category} onChange={(v) => set('category', v as string)} options={DISCOUNT_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))} />
        </View>
        <View style={half}>
          <Select
            label="Canal"
            value={f.channel}
            onChange={(v) => set('channel', v as Channel)}
            options={[
              { value: 'in_store', label: 'Presencial' },
              { value: 'online', label: 'Online' },
              { value: 'both', label: 'Ambos' },
            ]}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Input kind="url" label="URL oficial" value={f.source_url} onChangeText={(v) => set('source_url', v)} error={errors.source_url} containerStyle={half} placeholder="https://" />
        <Input kind="username" label="Código promocional" value={f.code} onChangeText={(v) => set('code', v.toUpperCase())} containerStyle={half} maxLength={40} />
      </View>
      <Input kind="multiline" label="Condiciones legales" value={f.terms} onChangeText={(v) => set('terms', v)} maxLength={3000} />
      <Switch label="Destacado" description="Aparece en “Los que más rinden”" value={f.is_featured} onChange={(v) => set('is_featured', v)} />
      <Switch label="Activo" description="Si lo desactivas deja de mostrarse a los usuarios" value={f.is_active} onChange={(v) => set('is_active', v)} />
      {errors.global ? (
        <Text variant="small" tone="coral">
          {errors.global}
        </Text>
      ) : null}
    </Modal>
  );
}
