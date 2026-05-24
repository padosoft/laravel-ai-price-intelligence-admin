import { useCallback, useEffect, useMemo, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { TenantSwitcher } from '@/components/layout/TenantSwitcher';
import { ROUTE_TITLES } from '@/components/layout/nav';
import { ToastProvider } from '@/components/ds';
import { createQueryClient } from '@/lib/api/queryClient';
import { AuthProvider } from '@/state/AuthProvider';
import { useAuth } from '@/state/auth-context';
import { useStats } from '@/hooks/useStats';
import '@/lib/i18n';
import type { NavCounts, RouteKey, Tenant, TenantFeatures, Theme, User } from '@/lib/types';

const THEME_KEY = 'pi-admin-theme';
const queryClient = createQueryClient();

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore — fall back to the OS preference */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
}

// The signed-in admin user is a host-app concern (Sanctum session), not core data, so it
// stays a constant for now; tenant + features come live from GET /tenants/me.
const ADMIN_USER: User = { name: 'Lorenzo Padovani', initials: 'LP', role: 'Pricing lead' };
const FALLBACK_TENANT: Tenant = { id: '—', code: '—', name: 'Loading…' };
const DEMO_TENANTS: Tenant[] = [
  { id: 'acme-it', code: 'ACME', name: 'Acme Italia', plan: 'Enterprise', current: true },
  { id: 'acme-es', code: 'ACES', name: 'Acme España', plan: 'Growth' },
];

function AppContent() {
  const { me, hasFeature } = useAuth();
  const stats = useStats();

  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [route, setRoute] = useState<RouteKey>('dashboard');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navigate = useCallback((next: RouteKey) => {
    setRoute(next);
    document.querySelector('.content')?.scrollTo(0, 0);
  }, []);

  const tenant: Tenant = me?.tenant
    ? { id: String(me.tenant.id), code: me.tenant.code ?? '—', name: me.tenant.name ?? '—' }
    : FALLBACK_TENANT;

  // Feature flags govern conditional nav (Reviews/Repricer/Compliance) — sourced from core.
  const features: TenantFeatures = useMemo(
    () => ({
      review_insight: hasFeature('review_insight'),
      repricer: hasFeature('repricer'),
      ai_act: hasFeature('ai_act'),
    }),
    [hasFeature],
  );

  const counts: NavCounts = {
    matches: stats.data?.matches_pending,
    alerts: stats.data?.alerts_unacknowledged,
    anomalies: stats.data?.anomalies_24h,
  };

  const title = (ROUTE_TITLES[route] ?? [route]).at(-1) ?? route;

  return (
    <>
      <AppShell
        route={route}
        onNavigate={navigate}
        tenant={tenant}
        user={ADMIN_USER}
        counts={counts}
        features={features}
        theme={theme}
        onTheme={setTheme}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenTenant={() => setTenantOpen(true)}
      >
        <div className="page" data-testid="app-page">
          <div className="page-head">
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-sub">
                Connected to {tenant.name}. Screen implementation lands in the A3–A6 phases.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body muted">
              Route: <code>{route}</code>. Features —{' '}
              repricer: <b>{String(features.repricer)}</b>, reviews:{' '}
              <b>{String(features.review_insight)}</b>, ai_act: <b>{String(features.ai_act)}</b>.
            </div>
          </div>
        </div>
      </AppShell>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        onOpenCompetitor={() => navigate('competitor_detail')}
        features={features}
      />
      <TenantSwitcher open={tenantOpen} onClose={() => setTenantOpen(false)} tenants={DEMO_TENANTS} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
