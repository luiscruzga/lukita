import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  LocationsStatus,
  AdminMerchant,
  AdminMerchantDetail,
  AdminStats,
  AdminUser,
  AlertRule,
  AppNotification,
  CalendarDay,
  Discount,
  DiscountReport,
  Merchant,
  MerchantLocation,
  NearbyDiscount,
  Paginated,
  PaymentOption,
  Profile,
  Provider,
  ProviderCategory,
  Role,
  SavingEntry,
  SavingsStats,
  UserAccount,
} from '@/types/domain';

export interface DiscountFilters {
  q?: string;
  mine?: boolean;
  day?: number | null;
  date?: string | null;
  category?: string | null;
  providerIds?: string[];
  channel?: string | null;
  type?: string | null;
  minValue?: number | null;
  featured?: boolean;
  sort?: 'relevance' | 'value' | 'ending' | 'newest';
  pageSize?: number;
}

export const qk = {
  me: ['me'] as const,
  accounts: ['me', 'accounts'] as const,
  categories: ['catalog', 'categories'] as const,
  providers: (p: object) => ['providers', p] as const,
  discounts: (f: object) => ['discounts', f] as const,
  discount: (id: string) => ['discount', id] as const,
  nearby: (p: object) => ['nearby', p] as const,
  calendar: (m: string, mine: boolean, f?: { category?: string | null; q?: string }) => ['calendar', m, mine, f?.category ?? null, f?.q ?? ''] as const,
  favorites: ['me', 'favorites'] as const,
  savings: (p: object) => ['me', 'savings', p] as const,
  stats: ['me', 'stats'] as const,
  notifications: ['me', 'notifications'] as const,
  alerts: ['me', 'alerts'] as const,
};

// ---------- perfil y cuentas ----------
export const useMe = (enabled = true) => useQuery({ queryKey: qk.me, queryFn: () => api.get<Profile>('/v1/me'), enabled, staleTime: 60_000 });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<Profile, 'display_name' | 'comuna' | 'region' | 'monthly_goal' | 'avatar_url'>>) => api.patch<Profile>('/v1/me', body),
    onSuccess: (p) => qc.setQueryData(qk.me, p),
  });
}

export const useAccounts = (enabled = true) => useQuery({ queryKey: qk.accounts, queryFn: () => api.get<{ data: UserAccount[] }>('/v1/me/accounts').then((r) => r.data), enabled });

export function useSaveAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accounts: { provider_id: string; product_id: string | null }[]) => api.put<{ data: UserAccount[] }>('/v1/me/accounts', { accounts }),
    onSuccess: (r) => {
      qc.setQueryData(qk.accounts, r.data);
      qc.invalidateQueries({ queryKey: ['discounts'] });
      qc.invalidateQueries({ queryKey: ['nearby'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

// ---------- catálogo ----------
export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: () => api.get<{ data: ProviderCategory[] }>('/v1/catalog/categories').then((r) => r.data), staleTime: 3_600_000 });

export const useProviders = (params: { category?: string | null; q?: string; page?: number; pageSize?: number; withProducts?: boolean }) =>
  useQuery({ queryKey: qk.providers(params), queryFn: () => api.get<Paginated<Provider>>('/v1/providers', params), placeholderData: keepPreviousData, staleTime: 600_000 });

export const useMerchants = (params: { q?: string; category?: string | null; page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ['merchants', params], queryFn: () => api.get<Paginated<Merchant>>('/v1/merchants', params), placeholderData: keepPreviousData });

// ---------- descuentos ----------
function discountQuery(f: DiscountFilters, page: number) {
  return {
    q: f.q,
    mine: f.mine ? 'true' : undefined,
    day: f.day ?? undefined,
    date: f.date ?? undefined,
    category: f.category ?? undefined,
    providerIds: f.providerIds,
    channel: f.channel ?? undefined,
    type: f.type ?? undefined,
    minValue: f.minValue ?? undefined,
    featured: f.featured ? 'true' : undefined,
    sort: f.sort,
    page,
    pageSize: f.pageSize ?? 20,
  };
}

export const useDiscounts = (f: DiscountFilters, page = 1, enabled = true) =>
  useQuery({ queryKey: qk.discounts({ ...f, page }), queryFn: ({ signal }) => api.get<Paginated<Discount>>('/v1/discounts', discountQuery(f, page), signal), placeholderData: keepPreviousData, enabled });

export const useInfiniteDiscounts = (f: DiscountFilters, enabled = true) =>
  useInfiniteQuery({
    queryKey: qk.discounts({ ...f, infinite: true }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => api.get<Paginated<Discount>>('/v1/discounts', discountQuery(f, pageParam), signal),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    enabled,
  });

export const useDiscount = (id?: string) =>
  useQuery({ queryKey: qk.discount(id ?? ''), queryFn: () => api.get<Discount & { locations: MerchantLocation[]; locations_status: LocationsStatus | null; alternatives: PaymentOption[] }>(`/v1/discounts/${id}`), enabled: !!id });

export const useNearby = (p: { lat?: number; lng?: number; radius: number; mine: boolean; day?: number | null; category?: string | null }, enabled = true) =>
  useQuery({
    queryKey: qk.nearby(p),
    queryFn: ({ signal }) => api.get<{ data: NearbyDiscount[] }>('/v1/discounts/nearby', { ...p, mine: p.mine ? 'true' : undefined, limit: 150 }, signal),
    select: (r: { data: NearbyDiscount[] }) => r.data,
    enabled: enabled && p.lat !== undefined && p.lng !== undefined,
    placeholderData: keepPreviousData,
  });

export const useCalendar = (month: string, mine: boolean, f?: { category?: string | null; q?: string }) =>
  useQuery({
    queryKey: qk.calendar(month, mine, f),
    queryFn: () => api.get<{ data: CalendarDay[] }>('/v1/discounts/calendar', { month, mine: mine ? 'true' : undefined, category: f?.category ?? undefined, q: f?.q?.trim() || undefined }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useBestPayment = (merchantId?: string, amount?: number) =>
  useQuery({ queryKey: ['best', merchantId, amount], queryFn: () => api.get<{ data: PaymentOption[] }>('/v1/discounts/best', { merchantId, amount }).then((r) => r.data), enabled: !!merchantId });

export function useReportDiscount() {
  return useMutation({ mutationFn: (p: { id: string; reason: string; comment?: string }) => api.post(`/v1/discounts/${p.id}/report`, { reason: p.reason, comment: p.comment }) });
}

// ---------- favoritos ----------
export const useFavorites = (page = 1) => useQuery({ queryKey: [...qk.favorites, page], queryFn: () => api.get<Paginated<Discount>>('/v1/me/favorites', { page, pageSize: 20 }), placeholderData: keepPreviousData });

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => (on ? api.post(`/v1/me/favorites/${id}`) : api.del(`/v1/me/favorites/${id}`)),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.favorites });
      qc.setQueryData(qk.discount(v.id), (old: Discount | undefined) => (old ? { ...old, is_favorite: v.on } : old));
      qc.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

// ---------- ahorro ----------
export const useSavings = (page = 1, pageSize = 10) => useQuery({ queryKey: qk.savings({ page, pageSize }), queryFn: () => api.get<Paginated<SavingEntry>>('/v1/me/savings', { page, pageSize }), placeholderData: keepPreviousData });
export const useSavingsStats = () => useQuery({ queryKey: qk.stats, queryFn: () => api.get<SavingsStats>('/v1/me/stats') });

export function useLogSaving() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { discount_id?: string | null; provider_id?: string | null; merchant_name?: string | null; amount_spent: number; amount_saved: number; used_on: string; note?: string | null }) => api.post<SavingEntry>('/v1/me/savings', b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'savings'] });
      qc.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

export function useDeleteSaving() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/v1/me/savings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'savings'] });
      qc.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

// ---------- notificaciones ----------
export const useNotifications = (enabled = true) =>
  useInfiniteQuery({
    queryKey: qk.notifications,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Paginated<AppNotification> & { unread: number }>('/v1/me/notifications', { page: pageParam, pageSize: 20 }),
    getNextPageParam: (l) => (l.page * l.pageSize < l.total ? l.page + 1 : undefined),
    enabled,
    refetchInterval: 120_000,
  });

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (ids: string[] | 'all') => api.post('/v1/me/notifications/read', { ids }), onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }) });
}

export const useAlerts = () => useQuery({ queryKey: qk.alerts, queryFn: () => api.get<{ data: AlertRule[] }>('/v1/me/alerts').then((r) => r.data) });
export function useSaveAlerts() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (rules: AlertRule[]) => api.put<{ data: AlertRule[] }>('/v1/me/alerts', { rules }), onSuccess: (r) => qc.setQueryData(qk.alerts, r.data) });
}

// ---------- admin ----------
export const useAdminStats = () => useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.get<AdminStats>('/v1/admin/stats') });

export const useAdminUsers = (p: { q?: string; role?: string | null; page: number; pageSize: number; sort?: string; dir?: string }) =>
  useQuery({ queryKey: ['admin', 'users', p], queryFn: () => api.get<Paginated<AdminUser>>('/v1/admin/users', p), placeholderData: keepPreviousData });

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, role }: { id: string; role: Role }) => api.patch(`/v1/admin/users/${id}/role`, { role }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
}

export const useAdminDiscounts = (p: { q?: string; providerId?: string | null; category?: string | null; status?: string | null; page: number; pageSize: number; sort?: string; dir?: string }) =>
  useQuery({ queryKey: ['admin', 'discounts', p], queryFn: () => api.get<Paginated<Discount>>('/v1/admin/discounts', p), placeholderData: keepPreviousData });

export function useSaveDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Discount> & { id?: string; provider_id: string; merchant_id?: string | null }) => (id ? api.patch<Discount>(`/v1/admin/discounts/${id}`, body) : api.post<Discount>('/v1/admin/discounts', body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'discounts'] });
      qc.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.del(`/v1/admin/discounts/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'discounts'] }) });
}

export const useAdminMerchants = (p: { q?: string; status?: string | null; category?: string | null; orphans?: boolean; page: number; pageSize: number; sort?: string; dir?: string }) =>
  useQuery({ queryKey: ['admin', 'merchants', p], queryFn: () => api.get<Paginated<AdminMerchant>>('/v1/admin/merchants', { ...p, orphans: p.orphans ? 'true' : undefined }), placeholderData: keepPreviousData });

export const useAdminMerchant = (id?: string) =>
  useQuery({ queryKey: ['admin', 'merchant', id], queryFn: () => api.get<AdminMerchantDetail>(`/v1/admin/merchants/${id}`), enabled: !!id });

/** Vuelve a buscar los locales del comercio (lo deja en la cola del worker). */
export function useRelocateMerchant() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.post(`/v1/admin/merchants/${id}/relocate`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }) });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.del(`/v1/admin/locations/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }) });
}

export const useAdminProviders = (p: { q?: string; category?: string | null; page: number; pageSize: number; sort?: string; dir?: string }) =>
  useQuery({ queryKey: ['admin', 'providers', p], queryFn: () => api.get<Paginated<Provider>>('/v1/admin/providers', p), placeholderData: keepPreviousData });

export function useSaveProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Provider> & { id?: string }) => (id ? api.patch<Provider>(`/v1/admin/providers/${id}`, body) : api.post<Provider>('/v1/admin/providers', body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      qc.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}

export const useAdminReports = (p: { status?: string | null; page: number; pageSize: number }) =>
  useQuery({ queryKey: ['admin', 'reports', p], queryFn: () => api.get<Paginated<DiscountReport>>('/v1/admin/reports', p), placeholderData: keepPreviousData });

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status, deactivate }: { id: string; status: 'resolved' | 'dismissed'; deactivate?: boolean }) => api.patch(`/v1/admin/reports/${id}`, { status, deactivate }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }) });
}

export type RunStatus = 'queued' | 'running' | 'success' | 'partial' | 'error' | 'skipped';

export interface IngestionRun {
  id: string;
  source: string;
  status: RunStatus;
  trigger: 'manual' | 'schedule' | 'cli';
  fetched: number;
  upserted: number;
  inserted: number;
  updated: number;
  skipped: number;
  deactivated: number;
  pages: number;
  duration_ms: number | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  errors?: string[];
  actor?: { display_name: string | null; email: string | null } | null;
}

export interface IngestionSource {
  id: string;
  providerSlug: string;
  name: string;
  description: string;
  needsBrowser: boolean;
  schedule: { enabled: boolean; interval_minutes: number; next_run_at: string; updated_at: string } | null;
  /** Ejecución en cola o en curso. */
  running: { id: string; status: 'queued' | 'running'; started_at: string } | null;
  lastRun: IngestionRun | null;
  summary7d: { runs: number; failed: number; fetched: number; inserted: number; updated: number; avg_duration_ms: number | null; last_success_at: string | null; active_discounts: number } | null;
}

export interface IngestionOverview {
  settings: { paused: boolean; default_interval_minutes: number; max_pages: number; updated_at: string };
  scheduler: { active: boolean; busy: boolean; current: string[]; queued: string[]; browserEnabled: boolean };
  locations: {
    merchants?: Partial<Record<'pending' | 'done' | 'none' | 'error', number>>;
    addresses?: Partial<Record<'pending' | 'done' | 'failed', number>>;
    locations?: Partial<Record<'manual' | 'address' | 'osm', number>>;
    merchants_with_locations?: number;
    worker: { enabled: boolean; active: boolean; current: string | null; processed: number; lastError: string | null; idleUntil: string | null; pausedUntil: string | null };
  };
  totals24h: { runs: number; failed: number; fetched: number; inserted: number; updated: number; deactivated: number };
  sources: IngestionSource[];
}

export const useIngestionOverview = () =>
  useQuery({
    queryKey: ['admin', 'ingest', 'overview'],
    queryFn: () => api.get<IngestionOverview>('/v1/admin/ingest/overview'),
    // Mientras algo corre, se refresca seguido para ver el avance.
    refetchInterval: (q) => {
      const d = q.state.data;
      return d && (d.scheduler.busy || d.scheduler.queued.length || d.sources.some((s) => s.running)) ? 4000 : 30_000;
    },
  });

export const useIngestionRuns = (p: { source?: string | null; status?: string | null; trigger?: string | null; latest?: boolean; page: number; pageSize: number; sort?: string; dir?: string }, live = false) =>
  useQuery({ queryKey: ['admin', 'ingest', 'runs', p], queryFn: () => api.get<Paginated<IngestionRun>>('/v1/admin/ingest/runs', { ...p, latest: p.latest ? 'true' : undefined }), placeholderData: keepPreviousData, refetchInterval: live ? 4000 : false });

export const useIngestionRun = (id?: string | null) =>
  useQuery({ queryKey: ['admin', 'ingest', 'run', id], queryFn: () => api.get<IngestionRun>(`/v1/admin/ingest/runs/${id}`), enabled: !!id, refetchInterval: (q) => (q.state.data?.status === 'running' || q.state.data?.status === 'queued' ? 3000 : false) });

function invalidateIngest(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin', 'ingest'] });
}

export function useUpdateIngestionSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: { paused?: boolean; default_interval_minutes?: number; max_pages?: number }) => api.patch('/v1/admin/ingest/settings', b), onSuccess: () => invalidateIngest(qc) });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ source, ...b }: { source: string; enabled?: boolean; interval_minutes?: number }) => api.patch(`/v1/admin/ingest/schedules/${source}`, b), onSuccess: () => invalidateIngest(qc) });
}

export function useUpdateAllSchedules() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: { enabled?: boolean; interval_minutes?: number }) => api.patch<{ updated: number }>('/v1/admin/ingest/schedules', b), onSuccess: () => invalidateIngest(qc) });
}

export function useRunIngestion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (source: string) => api.post<{ queued: { source: string; runId: string }[]; busy: string[] }>(`/v1/admin/ingest/${source}/run`), onSuccess: () => invalidateIngest(qc) });
}

export function useBroadcast() {
  return useMutation({ mutationFn: (b: { title: string; body: string; role?: Role | null }) => api.post<{ sent: number }>('/v1/admin/notifications/broadcast', b) });
}
