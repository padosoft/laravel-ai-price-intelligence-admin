import { createContext, useContext } from 'react';
import type { TenantMe } from '@/lib/api/types';

export interface AuthState {
  isLoading: boolean;
  isError: boolean;
  me: TenantMe | null;
  /** Whether a tenant feature flag is enabled (defaults false until loaded). */
  hasFeature: (key: string) => boolean;
  /** Whether the caller holds an ability ('*' grants all). */
  hasAbility: (ability: string) => boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function useFeature(key: string): boolean {
  return useAuth().hasFeature(key);
}

export function useAbility(ability: string): boolean {
  return useAuth().hasAbility(ability);
}
