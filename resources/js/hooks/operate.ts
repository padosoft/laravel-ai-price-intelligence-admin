import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api/client';
import type {
  Alert,
  Anomaly,
  CompetitorDetail,
  CompetitorListItem,
  CursorPage,
  FetchLog,
  MatchProposal,
  MonitoringTarget,
  PriceObservation,
  Product,
  Resource,
  TargetStatus,
} from '@/lib/api/types';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: () => api.get<CursorPage<Product>>('/catalog/products'),
  });
}

export function useTargets(status?: TargetStatus | 'all') {
  return useQuery({
    queryKey: ['targets', status ?? 'all'],
    queryFn: () =>
      api.get<CursorPage<MonitoringTarget>>('/targets', status && status !== 'all' ? { status } : undefined),
  });
}

export function useAlerts(limit?: number) {
  return useQuery({
    queryKey: ['alerts', { limit }],
    queryFn: () => api.get<CursorPage<Alert>>('/alerts', limit ? { per_page: limit } : undefined),
  });
}

export function useAnomalies(limit?: number) {
  return useQuery({
    queryKey: ['anomalies', { limit }],
    queryFn: () => api.get<CursorPage<Anomaly>>('/anomalies', limit ? { per_page: limit } : undefined),
  });
}

export function usePriceSeries(host: string, productId?: number | null, range?: string) {
  return useQuery({
    // Key by the values actually sent (range omitted from the request → null in the key)
    // so the cache entry matches the response, with no phantom default.
    queryKey: ['observations', 'prices', host, productId ?? null, range ?? null],
    queryFn: () =>
      api.get<CursorPage<PriceObservation>>('/observations/prices', {
        host,
        ...(productId != null ? { product_id: productId } : {}),
        ...(range ? { range } : {}),
      }),
  });
}

/** Price observation series for a single competitor listing (Competitor Detail price tab). */
export function useCompetitorPrices(competitorProductId: number) {
  return useQuery({
    queryKey: ['observations', 'prices', 'cp', competitorProductId],
    queryFn: () =>
      api.get<CursorPage<PriceObservation>>('/observations/prices', { competitor_product_id: competitorProductId }),
  });
}

/** Pending match proposals (the [60,85) human-review queue). */
export function useMatches(status: string = 'pending') {
  return useQuery({
    queryKey: ['matches', status],
    queryFn: () => api.get<CursorPage<MatchProposal>>('/matches', { status }),
  });
}

/**
 * Approve / reject a match proposal. Both invalidate the matches queue; the swipe deck
 * advances optimistically on its own and only relies on these for server persistence.
 */
export function useMatchActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['matches'] });

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/matches/${id}/approve`),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/matches/${id}/reject`),
    onSuccess: invalidate,
  });

  return { approve, reject };
}

/** Confirmed competitor listings, optionally narrowed by host and/or matched product
 * (both filters are applied server-side by the core, so large catalogs page correctly). */
export function useCompetitors(host?: string, productId?: number | null) {
  return useQuery({
    queryKey: ['competitor-products', { host: host ?? 'all', productId: productId ?? null }],
    queryFn: () =>
      api.get<CursorPage<CompetitorListItem>>('/competitor-products', {
        ...(host ? { host } : {}),
        ...(productId != null ? { product_id: productId } : {}),
      }),
  });
}

/** Single competitor listing detail (header + latest price/stock/promo/content snapshots).
 * Disabled for non-positive ids (e.g. navigated without a competitor selected). */
export function useCompetitorDetail(id: number) {
  return useQuery({
    queryKey: ['competitor-products', id],
    queryFn: () => api.get<Resource<CompetitorDetail>>(`/competitor-products/${id}`).then(unwrap),
    enabled: id > 0,
  });
}

/** Recent HTTP fetch audit log (Competitor Detail audit tab + the Audit screen). */
export function useFetchLogs(limit?: number) {
  return useQuery({
    queryKey: ['audit', 'fetch-logs', { limit }],
    queryFn: () => api.get<CursorPage<FetchLog>>('/audit/fetch-logs', limit ? { per_page: limit } : undefined),
  });
}

/**
 * Target actions. `scrapeNow` only queues background jobs (the list doesn't change
 * synchronously, so it doesn't invalidate); `setStatus` mutates the row and invalidates
 * the targets list on success.
 */
export function useTargetActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['targets'] });

  const scrapeNow = useMutation({
    mutationFn: (id: number) => api.post<{ data: { queued: number } }>(`/targets/${id}/scrape:now`),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TargetStatus }) =>
      api.patch<{ data: MonitoringTarget }>(`/targets/${id}`, { status }).then(unwrap),
    onSuccess: invalidate,
  });

  return { scrapeNow, setStatus };
}
