import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { NavCounts, RouteKey, Tenant, TenantFeatures, Theme, User } from '@/lib/types';

export interface AppShellProps {
  route: RouteKey;
  onNavigate: (route: RouteKey) => void;
  tenant: Tenant;
  user: User;
  counts?: NavCounts;
  features?: TenantFeatures;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onOpenPalette?: () => void;
  onOpenTenant?: () => void;
  children: ReactNode;
}

/**
 * App frame: sidebar + topbar + scrollable content. A self-managed auto-refresh
 * "tick" drives the live pill; palette/tenant openers are delegated to the parent
 * (wired to real data + the command palette in A2).
 */
export function AppShell({
  route,
  onNavigate,
  tenant,
  user,
  counts,
  features,
  theme,
  onTheme,
  onOpenPalette,
  onOpenTenant,
  children,
}: AppShellProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastTick, setLastTick] = useState(() => Date.now());

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => setLastTick(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, [autoRefresh]);

  const noop = useCallback(() => {}, []);

  return (
    <div className="app">
      <Sidebar route={route} onNavigate={onNavigate} counts={counts} features={features} user={user} tenant={tenant} />
      <div className="main">
        <Topbar
          route={route}
          theme={theme}
          onTheme={onTheme}
          autoRefresh={autoRefresh}
          onAutoRefresh={setAutoRefresh}
          onOpenPalette={onOpenPalette ?? noop}
          onOpenTenant={onOpenTenant ?? noop}
          lastTick={lastTick}
          alertCount={counts?.alerts ?? 0}
          tenant={tenant}
        />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
