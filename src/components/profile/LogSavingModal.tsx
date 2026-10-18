import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Select } from '../ui/Select';
import { Text } from '../ui/Text';
import { useToast } from '../ui/Toast';
import { BrandLogo } from '../brand/BrandLogo';
import { useAccounts, useLogSaving } from '@/hooks/queries';
import { todayISO } from '@/lib/dates';
import { formatCLP } from '@/lib/format';
import { estimateSaving } from '../discounts/discountFormat';
import type { Discount } from '@/types/domain';

/** Registrar un uso de descuento: alimenta los gráficos de "Mi ahorro". */
export function LogSavingModal({ visible, onClose, discount }: { visible: boolean; onClose: () => void; discount?: Discount | null }) {
  const toast = useToast();
  const accounts = useAccounts();
  const log = useLogSaving();
  const [spent, setSpent] = useState('');
  const [saved, setSaved] = useState('');
  const [touchedSaved, setTouchedSaved] = useState(false);
  const [date, setDate] = useState<string | null>(todayISO());
  const [provider, setProvider] = useState<string | null>(discount?.provider.id ?? null);
  const [merchant, setMerchant] = useState(discount?.merchant?.name ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setProvider(discount?.provider.id ?? null);
    setMerchant(discount?.merchant?.name ?? '');
    setSpent('');
    setSaved('');
    setTouchedSaved(false);
    setNote('');
    setError(null);
    setDate(todayISO());
  }, [visible, discount]);

  useEffect(() => {
    if (!discount || touchedSaved) return;
    const n = Number(spent);
    setSaved(n ? String(estimateSaving(discount, n)) : '');
  }, [spent, discount, touchedSaved]);

  const providers = (accounts.data ?? []).filter((a, i, arr) => a.provider && arr.findIndex((b) => b.provider_id === a.provider_id) === i);

  const submit = async () => {
    const s = Number(spent);
    const v = Number(saved);
    if (!s || s <= 0) return setError('Escribe cuánto pagaste.');
    if (v < 0 || v > s) return setError('El ahorro no puede ser mayor que lo que pagaste.');
    if (!date) return setError('Elige la fecha de la compra.');
    try {
      await log.mutateAsync({ discount_id: discount?.id ?? null, provider_id: provider, merchant_name: merchant.trim() || null, amount_spent: s, amount_saved: v, used_on: date, note: note.trim() || null });
      toast.show({ kind: 'success', title: `Ahorraste ${formatCLP(v)}`, message: 'Lo sumamos a tu ahorro del mes.' });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Registrar ahorro"
      subtitle={discount ? `${discount.merchant?.name ?? discount.title} · ${discount.provider.name}` : 'Anota una compra en la que usaste un descuento'}
      footer={
        <>
          <Button variant="secondary" label="Cancelar" onPress={onClose} />
          <Button variant="coin" label="Guardar ahorro" loading={log.isPending} onPress={submit} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Input kind="currency" label="Pagaste" placeholder="25000" value={spent} onChangeText={setSpent} containerStyle={{ flex: 1 }} maxLength={9} />
        <Input
          kind="currency"
          label="Ahorraste"
          placeholder="5000"
          value={saved}
          onChangeText={(v) => {
            setTouchedSaved(true);
            setSaved(v);
          }}
          hint={discount && !touchedSaved && saved ? 'Calculado con el tope' : undefined}
          containerStyle={{ flex: 1 }}
          maxLength={9}
        />
      </View>
      <DatePicker label="Fecha" value={date} onChange={setDate} max={todayISO()} />
      {!discount ? (
        <>
          <Select
            label="Cuenta que usaste"
            placeholder="Elige una cuenta"
            clearable
            value={provider}
            onChange={(v) => setProvider((v as string) ?? null)}
            options={providers.map((a) => ({ value: a.provider_id, label: a.provider!.name, leading: <BrandLogo name={a.provider!.name} domain={a.provider!.domain} logoUrl={a.provider!.logo_url} color={a.provider!.brand_color} size={28} /> }))}
          />
          <Input kind="text" label="Comercio" placeholder="Ej: Copec Av. Apoquindo" value={merchant} onChangeText={setMerchant} maxLength={120} />
        </>
      ) : null}
      <Input kind="multiline" label="Nota (opcional)" placeholder="Algo que quieras recordar" value={note} onChangeText={setNote} maxLength={300} />
      {error ? (
        <Text variant="small" tone="coral">
          {error}
        </Text>
      ) : null}
    </Modal>
  );
}
