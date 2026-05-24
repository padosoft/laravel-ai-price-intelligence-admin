import type { NavGroup, RouteKey } from '@/lib/types';

/** Sidebar navigation groups (ported from shell.jsx NAV_GROUPS). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operate',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'Home' },
      { key: 'catalog', label: 'Catalog', icon: 'Box' },
      { key: 'targets', label: 'Targets', icon: 'Target' },
      { key: 'matches', label: 'Matches', icon: 'Compare', badgeKey: 'matches' },
      { key: 'competitors', label: 'Competitors', icon: 'Store' },
      { key: 'prices', label: 'Prices', icon: 'Tag' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { key: 'anomalies', label: 'Anomalies', icon: 'Anomaly', badgeKey: 'anomalies' },
      { key: 'forecasts', label: 'Forecasts', icon: 'TrendUp' },
      { key: 'narrative', label: 'Narrative', icon: 'FileText' },
      { key: 'assortment', label: 'Assortment', icon: 'Layers' },
      { key: 'content_gap', label: 'Content gap', icon: 'ScanLine' },
      { key: 'reviews', label: 'Reviews', icon: 'Heart', feature: 'review_insight' },
    ],
  },
  {
    label: 'Pricing',
    items: [{ key: 'repricer', label: 'Repricer', icon: 'Wrench', feature: 'repricer' }],
  },
  {
    label: 'System',
    items: [
      { key: 'alerts', label: 'Alerts', icon: 'Bell', badgeKey: 'alerts' },
      { key: 'webhooks', label: 'Webhooks', icon: 'Webhook' },
      { key: 'api_keys', label: 'API keys', icon: 'Key' },
      { key: 'compliance', label: 'Compliance', icon: 'Shield', feature: 'ai_act' },
      { key: 'settings', label: 'Settings', icon: 'Settings' },
    ],
  },
];

/** Breadcrumb labels per route (ported from shell.jsx ROUTE_TITLES). */
export const ROUTE_TITLES: Record<RouteKey, string[]> = {
  dashboard: ['Dashboard'],
  catalog: ['Operate', 'Catalog'],
  targets: ['Operate', 'Targets'],
  matches: ['Operate', 'Matches review'],
  competitors: ['Operate', 'Competitors'],
  competitor_detail: ['Operate', 'Competitors', 'Detail'],
  prices: ['Operate', 'Prices'],
  anomalies: ['Intelligence', 'Anomalies'],
  forecasts: ['Intelligence', 'Forecasts'],
  narrative: ['Intelligence', 'Weekly narrative'],
  assortment: ['Intelligence', 'Assortment gaps'],
  content_gap: ['Intelligence', 'Content gaps'],
  reviews: ['Intelligence', 'Reviews'],
  repricer: ['Pricing', 'Repricer'],
  alerts: ['System', 'Alerts inbox'],
  webhooks: ['System', 'Webhooks'],
  api_keys: ['System', 'API keys'],
  compliance: ['System', 'Compliance'],
  settings: ['System', 'Settings'],
};
