import { Dashboard } from './Dashboard';
import { Catalog } from './Catalog';
import { Targets } from './Targets';
import { Matches } from './Matches';
import { Competitors } from './Competitors';
import { CompetitorDetail } from './CompetitorDetail';
import { Prices } from './Prices';
import { Anomalies } from './Anomalies';
import { Forecasts } from './Forecasts';
import { Narrative } from './Narrative';
import { Assortment } from './Assortment';
import { ContentGap } from './ContentGap';
import { Reviews } from './Reviews';
import { ROUTE_TITLES } from '@/components/layout/nav';
import type { RouteKey } from '@/lib/types';

export interface PageRouterProps {
  route: RouteKey;
  routeParams: Record<string, unknown>;
  onNavigate: (route: RouteKey, params?: Record<string, unknown>) => void;
}

/** Placeholder for routes whose screens land in later phases (A5–A6). */
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

export function PageRouter({ route, routeParams, onNavigate }: PageRouterProps) {
  switch (route) {
    case 'dashboard':
      return <Dashboard onNavigate={onNavigate} />;
    case 'catalog':
      return <Catalog onNavigate={onNavigate} />;
    case 'targets':
      return <Targets />;
    case 'matches':
      return <Matches />;
    case 'competitors':
      return <Competitors onNavigate={onNavigate} />;
    case 'competitor_detail': {
      const id = Number(routeParams.competitorId);
      return <CompetitorDetail competitorId={Number.isFinite(id) ? id : 0} onNavigate={onNavigate} />;
    }
    case 'prices':
      return <Prices />;
    case 'anomalies':
      return <Anomalies />;
    case 'forecasts':
      return <Forecasts />;
    case 'narrative':
      return <Narrative />;
    case 'assortment':
      return <Assortment />;
    case 'content_gap':
      return <ContentGap />;
    case 'reviews':
      return <Reviews />;
    default:
      return <ComingSoon route={route} />;
  }
}
