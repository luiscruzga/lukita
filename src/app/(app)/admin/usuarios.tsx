import { useState } from 'react';
import { View } from 'react-native';
import { useAdminUsers, useSetRole } from '@/hooks/queries';
import { useTableState } from '@/hooks/useTableState';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { ROLE_LABEL } from '@/constants/categories';
import { formatDate } from '@/lib/dates';
import type { AdminUser, Role } from '@/types/domain';

const ROLE_TONE: Record<Role, 'primary' | 'coin' | 'mint' | 'neutral'> = { admin: 'primary', moderator: 'coin', partner: 'mint', user: 'neutral' };

export default function AdminUsers() {
  return (
    <RoleGate roles={['admin']}>
      <Users />
    </RoleGate>
  );
}

function Users() {
  const t = useTableState({ key: 'created_at', dir: 'desc' });
  const [role, setRole] = useState<Role | null>(null);
  const q = useAdminUsers({ ...t.params, role });
  const setRoleM = useSetRole();
  const dialog = useDialog();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [nextRole, setNextRole] = useState<Role>('user');

  const columns: Column<AdminUser>[] = [
    {
      key: 'display_name',
      title: 'Usuario',
      width: 280,
      sortable: true,
      render: (u) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar uri={u.avatar_url} name={u.display_name ?? u.email} size={32} />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong" numberOfLines={1}>
              {u.display_name ?? 'Sin nombre'}
            </Text>
            <Text variant="caption" tone="soft" numberOfLines={1}>
              {u.email}
            </Text>
          </View>
        </View>
      ),
    },
    { key: 'role', title: 'Rol', width: 160, sortable: true, render: (u) => <Badge label={ROLE_LABEL[u.role]} tone={ROLE_TONE[u.role]} /> },
    { key: 'account_count', title: 'Cuentas', width: 110, sortable: true, align: 'right' },
    { key: 'created_at', title: 'Registro', width: 160, sortable: true, value: (u) => formatDate(u.created_at.slice(0, 10)) },
    { key: 'last_seen_at', title: 'Última actividad', width: 170, sortable: true, value: (u) => (u.last_seen_at ? formatDate(u.last_seen_at.slice(0, 10)) : '—') },
    { key: 'actions', title: '', width: 140, render: (u) => <Button size="sm" variant="secondary" label="Cambiar rol" onPress={() => { setEditing(u); setNextRole(u.role); }} /> },
  ];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1400}>
      <Text variant="h1">Usuarios</Text>
      <Text tone="soft">El rol se guarda en los metadatos públicos de Clerk y se sincroniza con Supabase.</Text>
      <DataTable
        columns={columns}
        rows={q.data?.data ?? []}
        rowKey={(u) => u.id}
        loading={q.isLoading}
        total={q.data?.total ?? 0}
        page={t.page}
        pageSize={t.pageSize}
        onPageChange={t.setPage}
        onPageSizeChange={t.setPageSize}
        sort={t.sort}
        onSortChange={t.setSort}
        toolbar={
          <>
            <Input kind="search" placeholder="Buscar por nombre o correo" value={t.search} onChangeText={t.setSearch} containerStyle={{ flex: 1, minWidth: 220 }} />
            <View style={{ width: 220 }}>
              <Select placeholder="Todos los roles" clearable value={role} onChange={(v) => { setRole((v as Role) ?? null); t.setPage(1); }} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value: value as Role, label }))} />
            </View>
          </>
        }
      />
      <Modal
        visible={!!editing}
        onClose={() => setEditing(null)}
        title="Cambiar rol"
        subtitle={editing?.email ?? ''}
        presentation="dialog"
        width={440}
        footer={
          <Button
            label="Guardar rol"
            loading={setRoleM.isPending}
            onPress={async () => {
              if (!editing) return;
              if (nextRole === 'admin' && !(await dialog.confirm({ title: 'Dar permisos de administrador', message: 'Podrá gestionar usuarios, roles y todo el catálogo.', tone: 'warning', confirmLabel: 'Sí, hacer admin' }))) return;
              try {
                await setRoleM.mutateAsync({ id: editing.id, role: nextRole });
                toast.show({ kind: 'success', title: 'Rol actualizado', message: `${editing.display_name ?? editing.email} ahora es ${ROLE_LABEL[nextRole]}.` });
                setEditing(null);
              } catch (e) {
                toast.show({ kind: 'error', title: 'No se pudo cambiar el rol', message: (e as Error).message });
              }
            }}
          />
        }
      >
        <Select label="Rol" value={nextRole} onChange={(v) => setNextRole(v as Role)} options={(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ value: r, label: ROLE_LABEL[r], description: { admin: 'Acceso total', moderator: 'Gestiona descuentos y reportes', partner: 'Publica descuentos de sus comercios', user: 'Uso normal de la app' }[r] }))} />
      </Modal>
    </Screen>
  );
}
