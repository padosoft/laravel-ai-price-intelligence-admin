import { Dashboard } from './Dashboard';
import { Catalog } from './Catalog';
import { Targets } from './Targets';
import { ROUTE_TITLES } from '@/components/layout/nav';
import type { RouteKey } from '@/lib/types';

export interface PageRouterProps {
  route: RouteKey;
  routeParams: Record<string, unknown>;
  onNavigate: (route: RouteKey, params?: Record<string, unknown>) => void;
}

/** Placeholder for routes whose screens land in later phases (A4–A6). */
function ComingSoon({ route }: { route: RouteKey }) {
  const title = (ROUTE_TITLES[route] ?? [route]).at(-1) ?? route;
  return (
    <div className="page" data-testid={`page-${route}`}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">This screen is implemented in a later phase.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body empty">Coming soon — wired to the live API in an upcoming phase.</div>
      </div>
    </div>
  );
}

export function PageRouter({ route, routeParams: _routeParams, onNavigate }: PageRouterProps) {
  switch (route) {
    case 'dashboard':
      return <Dashboard onNavigate={onNavigate} />;
    case 'catalog':
      return <Catalog onNavigate={onNavigate} />;
    case 'targets':
      return <Targets />;
    default:
      return <ComingSoon route={route} />;
  }
}
