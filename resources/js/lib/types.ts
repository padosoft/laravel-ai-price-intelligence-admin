import type { IconName } from '@/components/ds/icons';

/** UI colour theme. */
export type Theme = 'dark' | 'light';

/** The client-side route keys (mirrors the prototype's PageRouter switch). */
export type RouteKey =
  | 'dashboard'
  | 'catalog'
  | 'targets'
  | 'matches'
  | 'competitors'
  | 'competitor_detail'
  | 'prices'
  | 'anomalies'
  | 'forecasts'
  | 'narrative'
  | 'assortment'
  | 'content_gap'
  | 'reviews'
  | 'repricer'
  | 'alerts'
  | 'webhooks'
  | 'api_keys'
  | 'compliance'
  | 'settings';

/** Feature flags read from the core's GET /tenants/me. */
export interface TenantFeatures {
  review_insight?: boolean;
  repricer?: boolean;
  ai_act?: boolean;
  [key: string]: boolean | undefined;
}

export interface Tenant {
  id: string;
  code: string;
  name: string;
  plan?: string;
  current?: boolean;
  features?: TenantFeatures;
}

export interface User {
  name: string;
  initials: string;
  role: string;
}

/** Badge counters shown next to nav items. */
export interface NavCounts {
  matches?: number;
  alerts?: number;
  anomalies?: number;
}

export interface NavItem {
  key: RouteKey;
  label: string;
  icon: IconName;
  badgeKey?: keyof NavCounts;
  feature?: keyof TenantFeatures;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
