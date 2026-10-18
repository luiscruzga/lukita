import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Discount } from '@/types/domain';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useToggleFavorite } from '@/hooks/queries';
import { DiscountTicket } from './DiscountTicket';

/** Rejilla responsiva de cupones (1 col teléfono, 2 tablet, 3 escritorio). */
export function TicketGrid({ items, columns, animate = true }: { items: Discount[]; columns?: number; animate?: boolean }) {
  const bp = useBreakpoint();
  const cols = columns ?? Math.min(bp.columns, 3);
  const fav = useToggleFavorite();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {items.map((d, i) => (
        <Animated.View key={d.id} entering={animate ? FadeInDown.delay(Math.min(i, 8) * 40).duration(320) : undefined} style={{ width: `${100 / cols}%`, padding: 6 }}>
          <DiscountTicket d={d} onToggleFavorite={(x) => fav.mutate({ id: x.id, on: !x.is_favorite })} />
        </Animated.View>
      ))}
    </View>
  );
}
