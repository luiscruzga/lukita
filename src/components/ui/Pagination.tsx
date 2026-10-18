import { View } from 'react-native';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { IconButton } from './Button';
import { Pressable } from './Pressable';
import { Text } from './Text';

export const PAGE_SIZES = [10, 20, 50];

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: { page: number; pageSize: number; total: number; onPageChange: (p: number) => void; onPageSizeChange?: (s: number) => void }) {
  const { colors } = useTheme();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const window = pageWindow(page, pages);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="small" tone="soft">
          {from}–{to} de {total}
        </Text>
        {onPageSizeChange ? (
          <View style={{ flexDirection: 'row', gap: 4, marginLeft: 8 }}>
            {PAGE_SIZES.map((s) => (
              <Pressable
                key={s}
                onPress={() => onPageSizeChange(s)}
                accessibilityLabel={`${s} por página`}
                style={{ paddingHorizontal: 10, height: 30, borderRadius: radius.sm, justifyContent: 'center', backgroundColor: s === pageSize ? colors.primarySoft : 'transparent' }}
              >
                <Text variant="caption" tone={s === pageSize ? 'primary' : 'soft'}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <IconButton icon={ChevronsLeft} label="Primera página" size={32} tone="ghost" disabled={page <= 1} onPress={() => onPageChange(1)} />
        <IconButton icon={ChevronLeft} label="Página anterior" size={32} tone="ghost" disabled={page <= 1} onPress={() => onPageChange(page - 1)} />
        {window.map((p, i) =>
          p === -1 ? (
            <Text key={`e${i}`} tone="muted" style={{ paddingHorizontal: 4 }}>
              …
            </Text>
          ) : (
            <Pressable
              key={p}
              onPress={() => onPageChange(p)}
              accessibilityLabel={`Página ${p}`}
              accessibilityState={{ selected: p === page }}
              style={{ minWidth: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: p === page ? colors.primary : 'transparent' }}
            >
              <Text variant="smallStrong" style={{ color: p === page ? colors.onPrimary : colors.ink }}>
                {p}
              </Text>
            </Pressable>
          ),
        )}
        <IconButton icon={ChevronRight} label="Página siguiente" size={32} tone="ghost" disabled={page >= pages} onPress={() => onPageChange(page + 1)} />
        <IconButton icon={ChevronsRight} label="Última página" size={32} tone="ghost" disabled={page >= pages} onPress={() => onPageChange(pages)} />
      </View>
    </View>
  );
}

function pageWindow(page: number, pages: number): number[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: number[] = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push(-1);
    out.push(p);
  });
  return out;
}
