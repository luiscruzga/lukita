import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';

type Tone = 'info' | 'danger' | 'success' | 'warning';

interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface DialogApi {
  /** Reemplazo de window.confirm: resuelve true si el usuario confirma. */
  confirm: (o: DialogOptions) => Promise<boolean>;
  /** Reemplazo de window.alert / Alert.alert. */
  alert: (o: DialogOptions) => Promise<void>;
}

const Ctx = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [state, setState] = useState<(DialogOptions & { kind: 'confirm' | 'alert'; open: boolean }) | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const open = useCallback((kind: 'confirm' | 'alert', o: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      setState({ ...o, kind, open: true });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState((s) => (s ? { ...s, open: false } : s));
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (o) => open('confirm', o),
      alert: async (o) => {
        await open('alert', o);
      },
    }),
    [open],
  );

  const tone = state?.tone ?? 'info';
  const Icon = { info: Info, danger: Trash2, success: CheckCircle2, warning: AlertTriangle }[tone];
  const iconBg = { info: colors.primarySoft, danger: colors.coralSoft, success: colors.mintSoft, warning: colors.coinSoft }[tone];
  const iconFg = { info: colors.primary, danger: colors.coral, success: colors.mint, warning: colors.onCoin }[tone];

  return (
    <Ctx.Provider value={api}>
      {children}
      <Modal
        visible={!!state?.open}
        onClose={() => close(false)}
        presentation="dialog"
        width={440}
        dismissable={state?.kind !== 'alert'}
        footer={
          <>
            {state?.kind === 'confirm' ? <Button variant="secondary" label={state?.cancelLabel ?? 'Cancelar'} onPress={() => close(false)} /> : null}
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              label={state?.confirmLabel ?? (state?.kind === 'alert' ? 'Entendido' : 'Confirmar')}
              onPress={() => close(true)}
            />
          </>
        }
      >
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingTop: 20 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color={iconFg} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="title">{state?.title}</Text>
            {state?.message ? (
              <Text variant="body" tone="soft">
                {state.message}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDialog requiere <DialogProvider>');
  return ctx;
}
