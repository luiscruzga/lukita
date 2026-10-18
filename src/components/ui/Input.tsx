import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { Eye, EyeOff, Search, type LucideIcon } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { Text } from './Text';
import { Pressable } from './Pressable';

/**
 * Tipos de campo soportados. Cada tipo fija teclado, autocompletado y comportamiento de forma
 * coherente en Android, iOS y web (inputMode/autoComplete). No uses TextInput directamente.
 */
export type InputKind =
  | 'text'
  | 'name'
  | 'email'
  | 'password'
  | 'new-password'
  | 'username'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'phone'
  | 'search'
  | 'url'
  | 'multiline';

const KIND_PROPS: Record<InputKind, Partial<TextInputProps>> = {
  text: { autoCapitalize: 'sentences' },
  name: { autoCapitalize: 'words', autoComplete: 'name', textContentType: 'name' },
  email: { keyboardType: 'email-address', inputMode: 'email', autoCapitalize: 'none', autoComplete: 'email', textContentType: 'emailAddress', autoCorrect: false },
  password: { secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'current-password', textContentType: 'password', autoCorrect: false },
  'new-password': { secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'new-password', textContentType: 'newPassword', autoCorrect: false },
  username: { autoCapitalize: 'none', autoComplete: 'username', textContentType: 'username', autoCorrect: false },
  number: { keyboardType: 'number-pad', inputMode: 'numeric' },
  decimal: { keyboardType: 'decimal-pad', inputMode: 'decimal' },
  currency: { keyboardType: 'number-pad', inputMode: 'numeric' },
  phone: { keyboardType: 'phone-pad', inputMode: 'tel', autoComplete: 'tel', textContentType: 'telephoneNumber' },
  search: { inputMode: 'search', returnKeyType: 'search', autoCapitalize: 'none', autoCorrect: false },
  url: { keyboardType: 'url', inputMode: 'url', autoCapitalize: 'none', autoCorrect: false, textContentType: 'URL' },
  multiline: { multiline: true, textAlignVertical: 'top', autoCapitalize: 'sentences' },
};

/** Saneado por tipo: los campos numéricos solo aceptan dígitos (y separador decimal). */
function sanitize(kind: InputKind, value: string) {
  if (kind === 'number' || kind === 'currency') return value.replace(/\D+/g, '');
  if (kind === 'decimal') return value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
  if (kind === 'phone') return value.replace(/[^\d+\s]/g, '');
  return value;
}

export interface InputProps extends Omit<TextInputProps, 'style' | 'onChangeText'> {
  kind?: InputKind;
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: LucideIcon;
  right?: ReactNode;
  onChangeText?: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  { kind = 'text', label, hint, error, icon, right, onChangeText, containerStyle, onFocus, onBlur, editable = true, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const isSecret = kind === 'password' || kind === 'new-password';
  const Icon = icon ?? (kind === 'search' ? Search : undefined);
  const borderColor = error ? colors.coral : focused ? colors.primary : colors.line;

  const ring = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 160 }),
    transform: [{ scale: withTiming(focused ? 1 : 0.98, { duration: 160 }) }],
  }));

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text variant="smallStrong" tone="soft" nativeID={rest.nativeID ? `${rest.nativeID}-label` : undefined}>
          {label}
        </Text>
      ) : null}
      <View>
        <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: error ? colors.coralSoft : colors.primarySoft }, ring]} />
        <View
          style={[
            styles.field,
            kind === 'multiline' && styles.multi,
            { backgroundColor: editable ? colors.surface : colors.surfaceAlt, borderColor },
          ]}
        >
          {Icon ? <Icon size={18} color={focused ? colors.primary : colors.inkMuted} /> : null}
          {kind === 'currency' ? <Text variant="bodyStrong" tone="muted">$</Text> : null}
          <TextInput
            ref={ref}
            {...KIND_PROPS[kind]}
            {...rest}
            editable={editable}
            secureTextEntry={isSecret ? !reveal : undefined}
            accessibilityLabel={rest.accessibilityLabel ?? label}
            placeholderTextColor={colors.inkMuted}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            onChangeText={(v) => onChangeText?.(sanitize(kind, v))}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              { color: colors.ink, fontFamily: fonts.body },
              kind === 'multiline' && { minHeight: 96, paddingTop: 12 },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
            ]}
          />
          {isSecret ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onPress={() => setReveal((r) => !r)}
              hitSlop={10}
            >
              {reveal ? <EyeOff size={18} color={colors.inkSoft} /> : <Eye size={18} color={colors.inkSoft} />}
            </Pressable>
          ) : null}
          {right}
        </View>
      </View>
      {error ? (
        <Text variant="caption" tone="coral" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  multi: { alignItems: 'flex-start', paddingVertical: 4 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, minWidth: 0 },
  ring: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: radius.md + 4, borderWidth: 4 },
});
