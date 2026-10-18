import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Check, ImagePlus, Shuffle } from 'lucide-react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AVATAR_SEEDS, AVATAR_STYLES, avatarUrl } from '@/constants/avatars';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Pressable } from '../ui/Pressable';
import { Text } from '../ui/Text';

const GROUPS = ['Ilustrados', 'Divertidos', 'Retro', 'Abstractos'] as const;

async function urlToDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * Galería de avatares (DiceBear) + subir foto propia. Devuelve un data URI listo para
 * `user.setProfileImage({ file })` de Clerk.
 */
export function AvatarPicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (dataUri: string) => Promise<void> }) {
  const { colors } = useTheme();
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('Divertidos');
  const [seedShift, setSeedShift] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seeds = AVATAR_SEEDS.map((_, i) => AVATAR_SEEDS[(i + seedShift) % AVATAR_SEEDS.length] + (seedShift ? seedShift : ''));

  const save = async (dataUri: string) => {
    setSaving(true);
    setError(null);
    try {
      await onPick(dataUri);
      onClose();
    } catch (e) {
      setError((e as Error).message || 'No se pudo actualizar el avatar.');
    } finally {
      setSaving(false);
    }
  };

  const upload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setError('Necesitamos permiso para acceder a tus fotos.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if ((a.fileSize ?? 0) > 8 * 1024 * 1024) return setError('La imagen supera 8 MB.');
    await save(a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : await urlToDataUri(a.uri));
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Elige tu avatar"
      subtitle="Más de 200 personajes gratis, o sube tu foto"
      width={640}
      footer={
        <>
          <Button variant="secondary" icon={ImagePlus} label="Subir foto" onPress={upload} disabled={saving} />
          <Button label="Usar este avatar" disabled={!selected} loading={saving} onPress={async () => selected && save(await urlToDataUri(selected.replace('/svg?', '/png?')))} />
        </>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {GROUPS.map((g) => (
          <Chip key={g} label={g} selected={group === g} onPress={() => setGroup(g)} />
        ))}
        <Chip label="Otros personajes" icon={Shuffle} onPress={() => setSeedShift((s) => s + 7)} />
      </ScrollView>
      {AVATAR_STYLES.filter((s) => s.group === group).map((style) => (
        <View key={style.id} style={{ gap: 8 }}>
          <Text variant="smallStrong" tone="soft">
            {style.name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {seeds.slice(0, 12).map((seed) => {
              // Miniaturas en SVG: el PNG de DiceBear tiene un rate limit bajo (~10 req/s) y responde 429
              // al cargar la grilla completa. El PNG se pide solo al guardar el elegido.
              const url = avatarUrl(style.id, seed, 'svg');
              const on = selected === url;
              return (
                <Pressable key={url} onPress={() => setSelected(url)} pressScale={0.9} accessibilityLabel={`Avatar ${style.name} ${seed}`} accessibilityState={{ selected: on }}>
                  <View style={{ width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 3, borderColor: on ? colors.primary : 'transparent', backgroundColor: colors.surfaceAlt }}>
                    <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} transition={150} cachePolicy="memory-disk" />
                  </View>
                  {on ? (
                    <Animated.View entering={ZoomIn.springify()} style={{ position: 'absolute', right: -4, top: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={13} color={colors.onPrimary} strokeWidth={3} />
                    </Animated.View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {error ? (
        <Text variant="small" tone="coral">
          {error}
        </Text>
      ) : null}
      <Text variant="caption" tone="muted">
        Avatares de DiceBear (licencias libres por estilo).
      </Text>
    </Modal>
  );
}
