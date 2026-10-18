import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { Pressable } from './Pressable';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Código de verificación de 6 dígitos. Usa un único TextInput oculto (soporta pegar el código
 * completo, autocompletado SMS/one-time-code y borrar hacia atrás) y dibuja las 6 casillas.
 */
export function OtpInput({ value, onChange, onComplete, length = 6, error, autoFocus = true, disabled }: Props) {
  const { colors } = useTheme();
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withSpring(0),
      );
    }
  }, [error, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const digits = value.split('');
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable pressScale={1} onPress={() => ref.current?.focus()} accessibilityLabel="Código de verificación de 6 dígitos">
      <Animated.View style={[styles.row, shakeStyle]}>
        {Array.from({ length }).map((_, i) => {
          const isActive = focused && i === activeIndex;
          const filled = !!digits[i];
          return (
            <Cell
              key={i}
              char={digits[i] ?? ''}
              active={isActive}
              filled={filled}
              borderColor={error ? colors.coral : isActive ? colors.primary : filled ? colors.lineStrong : colors.line}
              bg={filled ? colors.primarySoft : colors.surface}
              color={colors.ink}
              caret={colors.primary}
            />
          );
        })}
      </Animated.View>
      <TextInput
        ref={ref}
        value={value}
        editable={!disabled}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(t) => {
          const clean = t.replace(/\D+/g, '').slice(0, length);
          onChange(clean);
          if (clean.length === length) onComplete?.(clean);
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        caretHidden
        style={styles.hidden}
        accessibilityLabel="Código de verificación"
      />
    </Pressable>
  );
}

function Cell({ char, active, filled, borderColor, bg, color, caret }: { char: string; active: boolean; filled: boolean; borderColor: string; bg: string; color: string; caret: string }) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (filled) pop.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 10 }));
  }, [filled, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const blink = useSharedValue(1);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      blink.value = withTiming(blink.value > 0.5 ? 0 : 1, { duration: 260 });
    }, 520);
    return () => clearInterval(id);
  }, [active, blink]);
  const caretStyle = useAnimatedStyle(() => ({ opacity: blink.value }));
  return (
    <Animated.View style={[styles.cell, { borderColor, backgroundColor: bg }, style]}>
      {char ? (
        <Animated.Text style={{ color, fontFamily: fonts.displayHeavy, fontSize: 26 }}>{char}</Animated.Text>
      ) : active ? (
        <Animated.View style={[{ width: 2, height: 26, backgroundColor: caret, borderRadius: 1 }, caretStyle]} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  cell: { width: 48, height: 58, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, left: 0, top: 0 },
});
