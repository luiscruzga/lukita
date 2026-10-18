import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Modal } from './Modal';
import { Input } from './Input';
import { Pressable } from './Pressable';
import { Text } from './Text';

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  leading?: ReactNode;
}

interface Props<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | T[] | null;
  options: SelectOption<T>[];
  onChange: (v: T | T[] | null) => void;
  multiple?: boolean;
  searchable?: boolean;
  error?: string | null;
  clearable?: boolean;
  /** Bloquea el campo (p. ej. comuna sin región elegida). */
  disabled?: boolean;
  hint?: string;
}

/** Select con estilos propios (sin <select> nativo), con búsqueda y multi-selección. */
export function Select<T extends string>({ label, placeholder = 'Selecciona', value, options, onChange, multiple, searchable = options.length > 8, error, clearable, disabled, hint }: Props<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = useMemo(() => new Set(Array.isArray(value) ? value : value ? [value] : []), [value]);
  const filtered = useMemo(() => {
    // Sin tildes ni mayúsculas: "nunoa" encuentra "Ñuñoa".
    const n = fold(q.trim());
    return n ? options.filter((o) => fold(o.label).includes(n)) : options;
  }, [options, q]);
  const display = options.filter((o) => selected.has(o.value)).map((o) => o.label);

  const toggle = (v: T) => {
    if (!multiple) {
      onChange(v);
      setOpen(false);
      return;
    }
    const next = new Set(selected);
    next.has(v) ? next.delete(v) : next.add(v);
    onChange(Array.from(next) as T[]);
  };

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
        onPress={() => setOpen(true)}
        disabled={disabled}
        pressScale={0.99}
        style={{ opacity: disabled ? 0.55 : 1, minHeight: 50, borderRadius: radius.md, borderWidth: 1.5, borderColor: error ? colors.coral : colors.line, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Text variant="body" tone={display.length ? 'ink' : 'muted'} numberOfLines={1} style={{ flex: 1 }}>
          {display.length ? (display.length > 2 ? `${display.slice(0, 2).join(', ')} +${display.length - 2}` : display.join(', ')) : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.inkSoft} />
      </Pressable>
      {error ? (
        <Text variant="caption" tone="coral">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
      <Modal
        visible={open}
        onClose={() => {
          setOpen(false);
          setQ('');
        }}
        title={label ?? placeholder}
        scroll={false}
        footer={
          multiple || clearable ? (
            <>
              {clearable || multiple ? (
                <Pressable onPress={() => onChange(multiple ? ([] as T[]) : null)} style={{ padding: 10 }}>
                  <Text variant="smallStrong" tone="primary">
                    Limpiar
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setOpen(false)} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.primary }}>
                <Text variant="smallStrong" tone="onPrimary">
                  Listo
                </Text>
              </Pressable>
            </>
          ) : undefined
        }
      >
        {searchable ? <Input kind="search" placeholder="Buscar…" value={q} onChangeText={setQ} /> : null}
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.value}
          style={{ maxHeight: 420 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const on = selected.has(item.value);
            return (
              <Pressable
                onPress={() => toggle(item.value)}
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: on }}
                pressScale={0.99}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.sm, backgroundColor: on ? colors.primarySoft : 'transparent' }}
              >
                {item.leading}
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{item.label}</Text>
                  {item.description ? (
                    <Text variant="caption" tone="soft">
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                {on ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text tone="muted" align="center" style={{ padding: 24 }}>
              Sin resultados para “{q}”
            </Text>
          }
        />
      </Modal>
    </View>
  );
}
