import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';
import { LukitaLoader } from '../brand/LukitaLoader';
import { validSdkUrl, type ProtectCheckProps } from './protectTypes';

// import() dinámico fuera del bundler: Metro no puede resolver un módulo remoto en tiempo de build.
const importRemote = new Function('u', 'return import(u)') as (u: string) => Promise<{ default?: unknown }>;

/**
 * Verificación anti-bots de Clerk Protect (web). Carga el módulo del desafío desde `sdkUrl`, le
 * entrega un contenedor y devuelve el "proof token" que luego se envía con `submitProtectCheck`.
 */
export function ProtectCheck({ challenge, onToken, onError }: ProtectCheckProps) {
  const { colors } = useTheme();
  const box = useRef<ComponentRef<typeof View>>(null);
  const [widget, setWidget] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const url = validSdkUrl(challenge.sdkUrl);
      if (!url) return onError('La verificación de seguridad entregó una URL no válida.');
      try {
        const mod = await importRemote(url);
        if (typeof mod.default !== 'function') throw new Error('El módulo de verificación no es válido.');
        const proof = await (mod.default as (c: HTMLElement, o: object) => Promise<string>)(box.current as unknown as HTMLElement, {
          token: challenge.token,
          uiHints: challenge.uiHints,
          signal: ctrl.signal,
          setWidgetVisible: async (v: boolean) => setWidget(v),
        });
        if (!ctrl.signal.aborted) onToken(proof);
      } catch (e) {
        if (!ctrl.signal.aborted) onError((e as Error).message || 'No se pudo completar la verificación de seguridad.');
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.token]);

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <ShieldCheck size={18} color={colors.primary} />
        <Text variant="smallStrong">Verificación de seguridad</Text>
      </View>
      {!widget ? <LukitaLoader size={64} label="Comprobando que no eres un robot…" /> : null}
      <View ref={box} style={{ minHeight: widget ? 70 : 0, alignItems: 'center' }} />
    </View>
  );
}
