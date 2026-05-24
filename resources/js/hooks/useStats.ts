import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api/client';
import type { DashboardStats } from '@/lib/api/types';

export function useStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<{ data: DashboardStats }>('/stats').then(unwrap),
    staleTime: 30_000,
    // Hold the request until auth has resolved (avoids a doomed /stats call mid-login).
    enabled: options.enabled ?? true,
  });
}
