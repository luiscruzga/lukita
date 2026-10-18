import { useEffect, useState } from 'react';
import type { SortState } from '@/components/ui/DataTable';

/** Estado estándar de una tabla paginada en servidor (búsqueda con debounce, orden, página). */
export function useTableState(initialSort: SortState | null = null, initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<SortState | null>(initialSort);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);
  return {
    page,
    setPage,
    pageSize,
    setPageSize: (s: number) => {
      setPageSize(s);
      setPage(1);
    },
    sort,
    setSort: (s: SortState | null) => {
      setSort(s);
      setPage(1);
    },
    search,
    setSearch,
    q,
    params: { page, pageSize, q: q || undefined, sort: sort?.key, dir: sort?.dir },
  };
}
