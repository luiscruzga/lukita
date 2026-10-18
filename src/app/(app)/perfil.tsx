import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useClerk, useUser, isDevAuth } from '@/auth';
import { router } from 'expo-router';
import { Camera, Download, KeyRound, LogOut, Moon, RefreshCw, Sun, UserRound } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useMe, useUpdateMe } from '@/hooks/queries';
import { useRole } from '@/hooks/useRole';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Segmented } from '@/components/ui/Segmented';
import { Pressable } from '@/components/ui/Pressable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogProvider';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { PasswordMeter } from '@/components/profile/PasswordMeter';
import { UpdatePrompt } from '@/components/layout/UpdatePrompt';
import { UpdateService, type UpdateInfo } from '@/services/updateService';
import { ROLE_LABEL } from '@/constants/categories';
import { COMUNAS_BY_REGION, REGIONS } from '@/constants/regions';
import { clerkError } from '@/lib/clerkErrors';

export default function Perfil() {
  const { colors, mode, setMode } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useRole();
  const me = useMe();
  const updateMe = useUpdateMe();
  const toast = useToast();
  const dialog = useDialog();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [comuna, setComuna] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [checking, setChecking] = useState(false);
  const [manualUpdate, setManualUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setUsername(user?.username ?? '');
  }, [user?.firstName, user?.lastName, user?.username]);
  useEffect(() => {
    setComuna(me.data?.comuna ?? '');
    setRegion(me.data?.region ?? null);
  }, [me.data?.comuna, me.data?.region]);
  useEffect(() => {
    UpdateService.isAutoEnabled().then(setAutoUpdate);
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    if (!firstName.trim()) return setError('El nombre no puede quedar vacío.');
    setSaving(true);
    setError(null);
    try {
      const body: { firstName: string; lastName: string; username?: string } = { firstName: firstName.trim(), lastName: lastName.trim() };
      if (username.trim() && username.trim() !== user.username) body.username = username.trim();
      await user.update(body);
      await updateMe.mutateAsync({ display_name: `${firstName} ${lastName}`.trim(), comuna: comuna.trim() || null, region });
      toast.show({ kind: 'success', title: 'Perfil actualizado' });
    } catch (e) {
      setError(clerkError(e));
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async (dataUri: string) => {
    if (!user) return;
    await user.setProfileImage({ file: dataUri });
    await user.reload();
    // La API vuelve a leer el avatar desde Clerk (fuente de verdad); esta URL solo avisa que cambió.
    await updateMe.mutateAsync({ avatar_url: user.imageUrl });
    toast.show({ kind: 'success', title: 'Avatar actualizado' });
  };

  const checkUpdates = async () => {
    setChecking(true);
    const r = await UpdateService.check(true);
    setChecking(false);
    if (r.hasUpdate) setManualUpdate(r);
    else toast.show({ kind: 'info', title: 'Estás al día', message: `Tienes la última versión (${r.currentVersion}).` });
  };

  const logout = async () => {
    if (await dialog.confirm({ title: 'Cerrar sesión', message: 'Tendrás que volver a ingresar para ver tus descuentos.', confirmLabel: 'Cerrar sesión' })) {
      await signOut();
      router.replace('/');
    }
  };

  return (
    <Screen topInset={false} keyboard maxWidth={1000} contentStyle={{ gap: 16 }}>
      <View style={{ backgroundColor: colors.primary, borderRadius: radius.xl, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <Pressable onPress={() => setAvatarOpen(true)} accessibilityLabel="Cambiar avatar" pressScale={0.94}>
          <Avatar uri={user?.imageUrl} name={user?.fullName} size={96} ring />
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.coin, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary }}>
            <Camera size={15} color={colors.onCoin} />
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 200, gap: 6 }}>
          <Text variant="h2" style={{ color: colors.onPrimary }}>
            {user?.fullName || user?.username || 'Tu perfil'}
          </Text>
          <Text style={{ color: colors.onPrimary, opacity: 0.8 }}>{user?.email}</Text>
          <Badge label={ROLE_LABEL[role]} tone="coin" />
          {isDevAuth ? <Badge label="Sesión local de prueba" tone="coral" /> : null}
        </View>
      </View>

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Panel title="Información básica" style={{ flex: 1.4, width: '100%' }}>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <Input kind="name" label="Nombre" value={firstName} onChangeText={setFirstName} icon={UserRound} containerStyle={{ flex: 1, minWidth: 180 }} maxLength={60} />
            <Input kind="name" label="Apellido" value={lastName} onChangeText={setLastName} containerStyle={{ flex: 1, minWidth: 180 }} maxLength={60} />
          </View>
          <Input kind="username" label="Nombre de usuario" placeholder="camila.rojas" value={username} onChangeText={setUsername} hint="Opcional. Letras, números, puntos y guiones." maxLength={64} />
          <Input kind="email" label="Correo" value={user?.email ?? ''} editable={false} hint="Para cambiar tu correo escríbenos desde el centro de ayuda." />
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 180 }}>
              <Select
                label="Región"
                placeholder="Elige tu región"
                value={region}
                onChange={(v) => {
                  const next = (v as string) ?? null;
                  setRegion(next);
                  // La comuna anterior deja de valer si no pertenece a la nueva región.
                  if (!next || !COMUNAS_BY_REGION[next]?.includes(comuna)) setComuna('');
                }}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
                searchable
                clearable
              />
            </View>
            <View style={{ flex: 1, minWidth: 180 }}>
              <Select
                label="Comuna"
                placeholder={region ? 'Elige tu comuna' : 'Primero elige tu región'}
                value={comuna || null}
                onChange={(v) => setComuna((v as string) ?? '')}
                options={(region ? (COMUNAS_BY_REGION[region] ?? []) : []).map((c) => ({ value: c, label: c }))}
                searchable
                clearable
                disabled={!region}
              />
            </View>
          </View>
          {error ? (
            <Text variant="small" tone="coral">
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button label="Guardar cambios" loading={saving} onPress={saveProfile} />
            <Button variant="secondary" icon={KeyRound} label="Cambiar contraseña" onPress={() => setPwOpen(true)} />
          </View>
        </Panel>

        <View style={{ flex: 1, gap: 16, width: '100%' }}>
          <Panel title="Apariencia">
            <Segmented
              value={mode}
              onChange={(m) => setMode(m)}
              options={[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Oscuro' },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {mode === 'light' ? <Sun size={16} color={colors.inkSoft} /> : <Moon size={16} color={colors.coin} />}
              <Text variant="caption" tone="soft">
                El tema se recuerda en este dispositivo.
              </Text>
            </View>
          </Panel>
          <Panel title="Actualizaciones">
            <Text variant="small" tone="soft">
              Versión {UpdateService.currentVersion()}
            </Text>
            {UpdateService.isSupported() ? (
              <>
                <Switch label="Buscar actualizaciones al abrir" description="Desde GitHub Releases" value={autoUpdate} onChange={(v) => { setAutoUpdate(v); UpdateService.setAutoEnabled(v); }} />
                <Button variant="secondary" icon={RefreshCw} label="Buscar ahora" loading={checking} onPress={checkUpdates} />
              </>
            ) : Platform.OS === 'web' ? (
              <Button variant="secondary" icon={Download} label="Descargar app para Android" onPress={() => UpdateService.openReleasePage()} />
            ) : null}
          </Panel>
          <Button variant="danger" icon={LogOut} label="Cerrar sesión" fullWidth onPress={logout} />
        </View>
      </View>

      <AvatarPicker visible={avatarOpen} onClose={() => setAvatarOpen(false)} onPick={pickAvatar} />
      <ChangePasswordModal visible={pwOpen} onClose={() => setPwOpen(false)} hasPassword={!!user?.passwordEnabled} />
      <UpdatePrompt manual={manualUpdate} onManualDone={() => setManualUpdate(null)} />
    </Screen>
  );
}

function ChangePasswordModal({ visible, onClose, hasPassword }: { visible: boolean; onClose: () => void; hasPassword: boolean }) {
  const { user } = useUser();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (next.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (next !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    setError(null);
    try {
      await user!.updatePassword({ currentPassword: hasPassword ? current : undefined, newPassword: next, signOutOfOtherSessions: signOutOthers });
      toast.show({ kind: 'success', title: 'Contraseña actualizada' });
      setCurrent('');
      setNext('');
      setConfirm('');
      onClose();
    } catch (e) {
      setError(clerkError(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal visible={visible} onClose={onClose} title="Cambiar contraseña" presentation="dialog" width={460} footer={<Button label="Actualizar contraseña" loading={loading} onPress={submit} />}>
      {hasPassword ? <Input kind="password" label="Contraseña actual" value={current} onChangeText={setCurrent} /> : null}
      <Input kind="new-password" label="Nueva contraseña" value={next} onChangeText={setNext} />
      <PasswordMeter password={next} />
      <Input kind="new-password" label="Repite la nueva contraseña" value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} />
      <Switch label="Cerrar sesión en otros dispositivos" value={signOutOthers} onChange={setSignOutOthers} />
      {error ? (
        <Text variant="small" tone="coral">
          {error}
        </Text>
      ) : null}
    </Modal>
  );
}
