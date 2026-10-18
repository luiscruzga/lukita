import { useState } from 'react';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useFavorites } from '@/hooks/queries';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TicketGrid } from '@/components/discounts/TicketGrid';

export default function Favoritos() {
  const [page, setPage] = useState(1);
  const fav = useFavorites(page);
  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }} refreshing={fav.isRefetching} onRefresh={() => fav.refetch()}>
      <Text variant="h1">Favoritos</Text>
      <Text tone="soft">Te avisamos cuando alguno esté por vencer.</Text>
      {fav.isLoading ? (
        <ListSkeleton />
      ) : (fav.data?.data.length ?? 0) === 0 ? (
        <EmptyState icon={Heart} title="Aún no guardas descuentos" message="Toca el corazón de un cupón para tenerlo a mano." action={<Button label="Explorar descuentos" onPress={() => router.push('/explorar')} />} />
      ) : (
        <>
          <TicketGrid items={fav.data!.data} />
          <Pagination page={page} pageSize={20} total={fav.data!.total} onPageChange={setPage} />
        </>
      )}
    </Screen>
  );
}
