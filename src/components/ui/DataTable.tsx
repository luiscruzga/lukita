import { useCallback, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { Pagination } from './Pagination';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDir;
}

export interface Column<T> {
  key: string;
  title: string;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number | null | undefined;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  sort?: SortState | null;
  onSortChange?: (s: SortState | null) => void;
  /** Barra de filtros (búsqueda, selects…) que se muestra sobre la tabla. */
  toolbar?: ReactNode;
  onRowPress?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
}

/**
 * Tabla de datos paginada en servidor: ordenamiento por columna (asc → desc → sin orden),
 * columnas redimensionables arrastrando el borde de la cabecera, filtros en `toolbar` y paginación.
 */
export function DataTable<T>({ columns, rows, rowKey, loading, total, page, pageSize, onPageChange, onPageSizeChange, sort, onSortChange, toolbar, onRowPress, emptyTitle = 'Sin resultados', emptyMessage = 'Ajusta los filtros o la búsqueda.' }: Props<T>) {
  const { colors } = useTheme();
  const [widths, setWidths] = useState<Record<string, number>>(() => Object.fromEntries(columns.map((c) => [c.key, c.width ?? 160])));
  const resize = useCallback((key: string, w: number) => setWidths((s) => ({ ...s, [key]: w })), []);
  const totalWidth = columns.reduce((a, c) => a + (widths[c.key] ?? 160), 0);

  const cycleSort = (key: string) => {
    if (!onSortChange) return;
    if (!sort || sort.key !== key) onSortChange({ key, dir: 'asc' });
    else if (sort.dir === 'asc') onSortChange({ key, dir: 'desc' });
    else onSortChange(null);
  };

  return (
    <View style={{ gap: 14 }}>
      {toolbar ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>{toolbar}</View> : null}
      <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
          <View style={{ width: Math.max(totalWidth, 0), flexGrow: 1 }}>
            <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const SortIcon = active ? (sort?.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <View key={c.key} style={{ width: widths[c.key], flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      disabled={!c.sortable}
                      onPress={() => cycleSort(c.key)}
                      pressScale={1}
                      accessibilityRole={c.sortable ? 'button' : 'header'}
                      accessibilityLabel={c.sortable ? `Ordenar por ${c.title}` : c.title}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 44, justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start' }}
                    >
                      <Text variant="caption" tone={active ? 'primary' : 'soft'} numberOfLines={1} style={{ fontSize: 13 }}>
                        {c.title}
                      </Text>
                      {c.sortable ? <SortIcon size={13} color={active ? colors.primary : colors.inkMuted} /> : null}
                    </Pressable>
                    <ResizeHandle width={widths[c.key]} min={c.minWidth ?? 80} onResize={(w) => resize(c.key, w)} color={colors.lineStrong} active={colors.primary} />
                  </View>
                );
              })}
            </View>
            {loading ? (
              <View style={{ padding: 16 }}>
                <TableSkeleton rows={Math.min(pageSize, 8)} cols={Math.min(columns.length, 6)} />
              </View>
            ) : rows.length === 0 ? (
              <EmptyState icon={SearchX} title={emptyTitle} message={emptyMessage} />
            ) : (
              rows.map((row, i) => (
                <Pressable
                  key={rowKey(row)}
                  disabled={!onRowPress}
                  onPress={() => onRowPress?.(row)}
                  pressScale={1}
                  style={[{ flexDirection: 'row', minHeight: 52, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: colors.line, backgroundColor: i % 2 ? colors.bg : colors.surface }, Platform.OS === 'web' ? ({ transitionDuration: '120ms' } as ViewStyle) : null]}
                >
                  {columns.map((c) => (
                    <View key={c.key} style={{ width: widths[c.key], paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', alignItems: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start' }}>
                      {c.render ? (
                        c.render(row)
                      ) : (
                        <Text variant="small" numberOfLines={2}>
                          {String(c.value?.(row) ?? (row as Record<string, unknown>)[c.key] ?? '—')}
                        </Text>
                      )}
                    </View>
                  ))}
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </View>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
    </View>
  );
}

function ResizeHandle({ width, min, onResize, color, active }: { width: number; min: number; onResize: (w: number) => void; color: string; active: string }) {
  const [dragging, setDragging] = useState(false);
  const start = useRef(width);
  const latest = useRef({ width, onResize, min });
  latest.current = { width, onResize, min };
  // PanResponder (y no gesture-handler) para ganarle el gesto al ScrollView horizontal en web y nativo.
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = latest.current.width;
        setDragging(true);
      },
      onPanResponderMove: (_e, g) => latest.current.onResize(Math.max(latest.current.min, Math.round(start.current + g.dx))),
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;
  return (
    <View
      {...responder.panHandlers}
      accessibilityLabel="Redimensionar columna"
      style={[{ width: 14, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -7, zIndex: 2 }, Platform.OS === 'web' ? ({ cursor: 'col-resize', touchAction: 'none', userSelect: 'none' } as unknown as ViewStyle) : null]}
    >
      <View style={{ width: 2, height: 20, borderRadius: 1, backgroundColor: dragging ? active : color }} />
    </View>
  );
}
