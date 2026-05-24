import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api/client';
import type { DashboardStats } from '@/lib/api/types';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<{ data: DashboardStats }>('/stats').then(unwrap),
    staleTime: 30_000,
  });
}
