import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api/client';
import type {
  Alert,
  Anomaly,
  CursorPage,
  MonitoringTarget,
  PriceObservation,
  Product,
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

export function usePriceSeries(host: string) {
  return useQuery({
    queryKey: ['observations', 'prices', host],
    queryFn: () => api.get<CursorPage<PriceObservation>>('/observations/prices', { host }),
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
