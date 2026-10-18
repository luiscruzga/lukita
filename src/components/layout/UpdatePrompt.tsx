import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Download, Rocket, Settings2 } from 'lucide-react-native';
import { UpdateService, type UpdateInfo } from '@/services/updateService';
import { useTheme } from '@/theme/ThemeProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';

type Phase = 'idle' | 'downloading' | 'ready' | 'error';

/** Comprueba al iniciar (si el usuario lo permite) y ofrece descargar e instalar la nueva versión. */
export function UpdatePrompt({ manual, onManualDone }: { manual?: UpdateInfo | null; onManualDone?: () => void }) {
  const { colors } = useTheme();
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!UpdateService.isSupported()) return;
    (async () => {
      if (!(await UpdateService.isAutoEnabled())) return;
      const r = await UpdateService.check(false);
      if (r.hasUpdate) setInfo(r);
    })();
  }, []);

  useEffect(() => {
    if (manual?.hasUpdate) setInfo(manual);
  }, [manual]);

  const close = useCallback(() => {
    if (phase === 'downloading') UpdateService.cancel();
    setInfo(null);
    setPhase('idle');
    setProgress(0);
    onManualDone?.();
  }, [onManualDone, phase]);

  const start = async () => {
    if (!info) return;
    if (!UpdateService.isSupported() || !info.apkUrl) {
      await UpdateService.openReleasePage(info.releaseUrl);
      return;
    }
    setPhase('downloading');
    setError(null);
    try {
      const uri = await UpdateService.download(info.apkUrl, info.latestVersion, (p) => setProgress(p.totalBytes ? p.writtenBytes / p.totalBytes : 0));
      if (!uri) {
        setPhase('idle');
        return;
      }
      setFile(uri);
      setPhase('ready');
      await UpdateService.install(uri);
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
    }
  };

  const bar = useAnimatedStyle(() => ({ width: withTiming(`${Math.round(progress * 100)}%`, { duration: 200 }) }));

  return (
    <Modal
      visible={!!info}
      onClose={close}
      presentation="dialog"
      width={460}
      title={`Lukita ${info?.latestVersion ?? ''} está disponible`}
      subtitle={`Tienes la ${info?.currentVersion ?? ''}`}
      footer={
        phase === 'ready' ? (
          <>
            <Button variant="secondary" icon={Settings2} label="Permitir instalación" onPress={() => UpdateService.openInstallPermissionSettings()} />
            <Button icon={Rocket} label="Instalar" onPress={() => file && UpdateService.install(file)} />
          </>
        ) : (
          <>
            <Button variant="secondary" label={phase === 'downloading' ? 'Cancelar' : 'Más tarde'} onPress={close} />
            <Button icon={Download} label={phase === 'error' ? 'Reintentar' : 'Actualizar'} loading={phase === 'downloading'} onPress={start} />
          </>
        )
      }
    >
      {info?.releaseNotes ? (
        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 14, padding: 14, maxHeight: 220 }}>
          <Text variant="small" tone="soft">
            {info.releaseNotes.replace(/^#+\s*/gm, '').slice(0, 1200)}
          </Text>
        </View>
      ) : null}
      {phase === 'downloading' ? (
        <View style={{ gap: 6 }}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
            <Animated.View style={[{ height: '100%', backgroundColor: colors.coin, borderRadius: 5 }, bar]} />
          </View>
          <Text variant="caption" tone="soft">
            Descargando… {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : null}
      {phase === 'ready' ? (
        <Text variant="small" tone="soft">
          Si Android no abre el instalador, permite a Lukita instalar apps desconocidas y vuelve a tocar Instalar.
        </Text>
      ) : null}
      {error ? (
        <Text variant="small" tone="coral">
          No se pudo descargar la actualización ({error}). Revisa tu conexión y reintenta.
        </Text>
      ) : null}
    </Modal>
  );
}
