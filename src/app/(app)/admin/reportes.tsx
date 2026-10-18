import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useAdminReports, useResolveReport } from '@/hooks/queries';
import { RoleGate } from '@/components/layout/RoleGate';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Segmented } from '@/components/ui/Segmented';
import { Badge } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/dates';
import type { DiscountReport } from '@/types/domain';

const REASON: Record<DiscountReport['reason'], string> = { expired: 'Ya no vigente', wrong_info: 'Información errónea', not_applied: 'No lo aplicaron', other: 'Otro' };

export default function AdminReports() {
  return (
    <RoleGate roles={['admin', 'moderator']}>
      <Reports />
    </RoleGate>
  );
}

function Reports() {
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed'>('open');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const q = useAdminReports({ status, page, pageSize });
  const resolve = useResolveReport();
  const dialog = useDialog();
  const toast = useToast();

  const columns: Column<DiscountReport>[] = [
    { key: 'discount', title: 'Descuento', width: 300, render: (r) => <View><Text variant="smallStrong" numberOfLines={1}>{r.discount.title}</Text><Text variant="caption" tone="soft">{r.discount.provider.name}</Text></View> },
    { key: 'reason', title: 'Motivo', width: 170, render: (r) => <Badge label={REASON[r.reason]} tone={r.reason === 'expired' ? 'coral' : 'coin'} /> },
    { key: 'comment', title: 'Comentario', width: 300, value: (r) => r.comment ?? '—' },
    { key: 'reporter', title: 'Reportado por', width: 200, value: (r) => r.reporter?.display_name ?? r.reporter?.email ?? 'Anónimo' },
    { key: 'created_at', title: 'Fecha', width: 140, value: (r) => formatDate(r.created_at.slice(0, 10)) },
    {
      key: 'actions',
      title: '',
      width: 110,
      render: (r) =>
        r.status === 'open' ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton
              icon={Check}
              label="Resolver"
              size={32}
              onPress={async () => {
                const deactivate = r.reason === 'expired' && (await dialog.confirm({ title: '¿Desactivar el descuento?', message: 'El reporte indica que ya no está vigente.', confirmLabel: 'Desactivar', cancelLabel: 'Solo resolver' }));
                await resolve.mutateAsync({ id: r.id, status: 'resolved', deactivate });
                toast.show({ kind: 'success', title: 'Reporte resuelto' });
              }}
            />
            <IconButton icon={X} label="Descartar" size={32} onPress={() => resolve.mutate({ id: r.id, status: 'dismissed' })} />
          </View>
        ) : null,
    },
  ];

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} maxWidth={1400}>
      <Text variant="h1">Reportes</Text>
      <View style={{ maxWidth: 420 }}>
        <Segmented value={status} onChange={(s) => { setStatus(s); setPage(1); }} options={[{ value: 'open', label: 'Abiertos' }, { value: 'resolved', label: 'Resueltos' }, { value: 'dismissed', label: 'Descartados' }]} />
      </View>
      <DataTable
        columns={columns}
        rows={q.data?.data ?? []}
        rowKey={(r) => r.id}
        loading={q.isLoading}
        total={q.data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowPress={(r) => router.push(`/descuento/${r.discount.id}`)}
        emptyTitle="Sin reportes"
        emptyMessage="Cuando un usuario reporte un descuento aparecerá aquí."
      />
    </Screen>
  );
}
