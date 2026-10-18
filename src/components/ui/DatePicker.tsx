import { useState } from 'react';
import { View } from 'react-native';
import { CalendarDays, Clock } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { formatDate, pad, todayISO } from '@/lib/dates';
import { Calendar } from './Calendar';
import { Modal } from './Modal';
import { Button } from './Button';
import { Pressable } from './Pressable';
import { Text } from './Text';

function FieldShell({ label, value, placeholder, icon: Icon, onPress, error }: { label?: string; value?: string; placeholder: string; icon: typeof CalendarDays; onPress: () => void; error?: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text variant="smallStrong" tone="soft">
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={onPress}
        pressScale={0.99}
        style={{ minHeight: 50, borderRadius: radius.md, borderWidth: 1.5, borderColor: error ? colors.coral : colors.line, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Icon size={18} color={colors.primary} />
        <Text tone={value ? 'ink' : 'muted'} style={{ flex: 1 }}>
          {value || placeholder}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" tone="coral">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Campo de fecha con calendario propio en modal. Valor 'YYYY-MM-DD'. */
export function DatePicker({ label, value, onChange, min, max, placeholder = 'Elige una fecha', error, clearable }: { label?: string; value: string | null; onChange: (v: string | null) => void; min?: string; max?: string; placeholder?: string; error?: string | null; clearable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(value);
  return (
    <>
      <FieldShell
        label={label}
        value={value ? formatDate(value, { weekday: true }) : ''}
        placeholder={placeholder}
        icon={CalendarDays}
        error={error}
        onPress={() => {
          setDraft(value ?? todayISO());
          setOpen(true);
        }}
      />
      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? 'Fecha'}
        presentation="dialog"
        width={400}
        footer={
          <>
            {clearable ? (
              <Button
                variant="ghost"
                label="Quitar fecha"
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
            ) : null}
            <Button variant="secondary" label="Hoy" onPress={() => setDraft(todayISO())} />
            <Button
              label="Aplicar"
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            />
          </>
        }
      >
        <Calendar value={draft} onChange={setDraft} min={min} max={max} />
      </Modal>
    </>
  );
}

/** Selector de hora propio: rejilla de horas + minutos en pasos de 5. Valor 'HH:MM'. */
export function TimePicker({ label, value, onChange, placeholder = 'Elige una hora', error, clearable }: { label?: string; value: string | null; onChange: (v: string | null) => void; placeholder?: string; error?: string | null; clearable?: boolean }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);
  const openPicker = () => {
    const [hh, mm] = (value ?? '12:00').split(':').map(Number);
    setH(hh || 0);
    setM(Math.round((mm || 0) / 5) * 5 % 60);
    setOpen(true);
  };
  const cell = (on: boolean) => ({ width: '15%' as const, minWidth: 44, height: 40, borderRadius: radius.sm, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: on ? colors.primary : colors.surfaceAlt });
  return (
    <>
      <FieldShell label={label} value={value ?? ''} placeholder={placeholder} icon={Clock} onPress={openPicker} error={error} />
      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? 'Hora'}
        presentation="dialog"
        width={420}
        footer={
          <>
            {clearable ? (
              <Button
                variant="ghost"
                label="Quitar hora"
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
            ) : null}
            <Button
              label={`Aplicar ${pad(h)}:${pad(m)}`}
              onPress={() => {
                onChange(`${pad(h)}:${pad(m)}`);
                setOpen(false);
              }}
            />
          </>
        }
      >
        <Text variant="number" align="center" style={{ marginVertical: 4 }}>
          {pad(h)}:{pad(m)}
        </Text>
        <Text variant="smallStrong" tone="soft">
          Hora
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <Pressable key={i} onPress={() => setH(i)} style={cell(i === h)} pressScale={0.9} accessibilityLabel={`${i} horas`}>
              <Text variant="smallStrong" style={{ color: i === h ? colors.onPrimary : colors.ink }}>
                {pad(i)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text variant="smallStrong" tone="soft">
          Minutos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: 12 }, (_, i) => i * 5).map((mm) => (
            <Pressable key={mm} onPress={() => setM(mm)} style={cell(mm === m)} pressScale={0.9} accessibilityLabel={`${mm} minutos`}>
              <Text variant="smallStrong" style={{ color: mm === m ? colors.onPrimary : colors.ink }}>
                {pad(mm)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}
