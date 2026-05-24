import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ROUTE_TITLES } from '@/components/layout/nav';
import { ToastProvider } from '@/components/ds';
import type { NavCounts, RouteKey, Tenant, TenantFeatures, Theme, User } from '@/lib/types';

const THEME_KEY = 'pi-admin-theme';

function readInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
}

// Demo identity/flags for the A1 shell. Replaced by the AuthProvider hydrated from
// GET /tenants/me in the A2 phase.
const DEMO_TENANT: Tenant = { id: 'acme-it', code: 'ACME', name: 'Acme Italia', plan: 'Enterprise' };
const DEMO_USER: User = { name: 'Lorenzo Padovani', initials: 'LP', role: 'Pricing lead' };
const DEMO_FEATURES: TenantFeatures = { review_insight: true, repricer: true, ai_act: true };
const DEMO_COUNTS: NavCounts = { matches: 12, alerts: 3, anomalies: 5 };

export default function App() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [route, setRoute] = useState<RouteKey>('dashboard');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const navigate = useCallback((next: RouteKey) => {
    setRoute(next);
    document.querySelector('.content')?.scrollTo(0, 0);
  }, []);

  const title = (ROUTE_TITLES[route] ?? [route]).at(-1) ?? route;

  return (
    <ToastProvider>
      <AppShell
        route={route}
        onNavigate={navigate}
        tenant={DEMO_TENANT}
        user={DEMO_USER}
        counts={DEMO_COUNTS}
        features={DEMO_FEATURES}
        theme={theme}
        onTheme={setTheme}
      >
        <div className="page" data-testid="app-page">
          <div className="page-head">
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-sub">Screen implementation lands in the A3–A6 phases.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body muted">
              Design system + shell ready. Route: <code>{route}</code>.
            </div>
          </div>
        </div>
      </AppShell>
    </ToastProvider>
  );
}
