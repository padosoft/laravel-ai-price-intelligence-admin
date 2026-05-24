import { useQuery } from '@tanstack/react-query';
import { useCallback, type ReactNode } from 'react';
import { api, unwrap } from '@/lib/api/client';
import type { TenantMe } from '@/lib/api/types';
import { AuthContext, type AuthState } from './auth-context';

function fetchMe(): Promise<TenantMe> {
  return api.get<{ data: TenantMe }>('/tenants/me').then(unwrap);
}

/**
 * Hydrates tenant identity + feature flags + abilities from GET /tenants/me and exposes
 * them via useAuth/useFeature/useAbility. The single source of truth for feature gating
 * is the core API — never duplicated in the UI.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery({ queryKey: ['tenants', 'me'], queryFn: fetchMe, staleTime: 5 * 60_000 });
  const me = query.data ?? null;

  const hasFeature = useCallback(
    (key: string): boolean => me?.features?.[key] === true,
    [me],
  );
  const hasAbility = useCallback(
    (ability: string): boolean => {
      const abilities = me?.abilities ?? [];
      return abilities.includes('*') || abilities.includes(ability);
    },
    [me],
  );

  const value: AuthState = {
    isLoading: query.isLoading,
    isError: query.isError,
    me,
    hasFeature,
    hasAbility,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
