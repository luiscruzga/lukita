import { useState } from 'react';
import { View } from 'react-native';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';

export const FREQUENCY_PRESETS = [
  { minutes: 60, label: 'Cada 1 hora' },
  { minutes: 120, label: 'Cada 2 horas' },
  { minutes: 360, label: 'Cada 6 horas' },
  { minutes: 720, label: 'Cada 12 horas' },
  { minutes: 1440, label: 'Una vez al día' },
  { minutes: 10080, label: 'Una vez a la semana' },
];

export function describeFrequency(minutes: number) {
  const preset = FREQUENCY_PRESETS.find((p) => p.minutes === minutes);
  if (preset) return preset.label;
  if (minutes % 1440 === 0) return `Cada ${minutes / 1440} días`;
  if (minutes % 60 === 0) return `Cada ${minutes / 60} horas`;
  return `Cada ${minutes} minutos`;
}

type Unit = 'min' | 'h' | 'd';
const FACTOR: Record<Unit, number> = { min: 1, h: 60, d: 1440 };

/** Selector de frecuencia: presets (1 h, 2 h, 6 h, 12 h, diaria, semanal) o personalizada (15 min a 7 días). */
export function FrequencyPicker({ value, onChange, label, disabled }: { value: number; onChange: (minutes: number) => void; label?: string; disabled?: boolean }) {
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState('3');
  const [unit, setUnit] = useState<Unit>('h');
  const [error, setError] = useState<string | null>(null);
  const isPreset = FREQUENCY_PRESETS.some((p) => p.minutes === value);
  const options = [
    ...FREQUENCY_PRESETS.map((p) => ({ value: String(p.minutes), label: p.label })),
    ...(isPreset ? [] : [{ value: String(value), label: describeFrequency(value) }]),
    { value: 'custom', label: 'Personalizada…' },
  ];

  const apply = () => {
    const minutes = Math.round(Number(amount) * FACTOR[unit]);
    if (!minutes || minutes < 15 || minutes > 10080) return setError('Elige entre 15 minutos y 7 días.');
    onChange(minutes);
    setCustom(false);
  };

  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }} pointerEvents={disabled ? 'none' : 'auto'}>
      <Select
        label={label}
        value={String(value)}
        onChange={(v) => {
          if (v === 'custom') {
            setError(null);
            setCustom(true);
          } else if (v) onChange(Number(v));
        }}
        options={options}
        searchable={false}
      />
      <Modal
        visible={custom}
        onClose={() => setCustom(false)}
        title="Frecuencia personalizada"
        subtitle="Entre 15 minutos y 7 días"
        presentation="dialog"
        width={420}
        footer={<Button label="Aplicar" onPress={apply} />}
      >
        <Input kind="decimal" label="Cada" value={amount} onChangeText={setAmount} maxLength={5} autoFocus />
        <Segmented
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'min', label: 'Minutos' },
            { value: 'h', label: 'Horas' },
            { value: 'd', label: 'Días' },
          ]}
        />
        {error ? (
          <Text variant="small" tone="coral">
            {error}
          </Text>
        ) : (
          <Text variant="caption" tone="soft">
            {describeFrequency(Math.round(Number(amount || 0) * FACTOR[unit]) || 0)}
          </Text>
        )}
      </Modal>
    </View>
  );
}
