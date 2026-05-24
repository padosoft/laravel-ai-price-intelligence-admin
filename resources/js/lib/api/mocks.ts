import type { CursorPage, DashboardStats, TenantMe } from './types';

// Dev/test fixture layer. Active only when runtimeConfig.useMocks is true (no live
// Laravel backend). This is a dev-render convenience — shipped screens call the real
// client; in production useMocks is false and requests hit the core API. Fixtures are
// extended per screen phase (A3+).

function emptyPage<T>(): CursorPage<T> {
  return {
    data: [],
    path: '/api/v1',
    per_page: 50,
    next_cursor: null,
    prev_cursor: null,
    next_page_url: null,
    prev_page_url: null,
  };
}

export function page<T>(items: T[]): CursorPage<T> {
  return { ...emptyPage<T>(), data: items, per_page: items.length || 50 };
}

const TENANT_ME: TenantMe = {
  tenant: { id: 'acme-it', code: 'ACME', name: 'Acme Italia' },
  features: {
    review_insight: true,
    repricer: true,
    ai_act: true,
    pii: true,
    visual_match: true,
    content_gap: true,
    forecast: true,
    anomaly: true,
    narrative: true,
    promo_detection: true,
    assortment: true,
  },
  abilities: ['*'],
};

const STATS: DashboardStats = {
  products: 4812,
  targets_active: 4120,
  competitors_monitored: 38104,
  matches_pending: 12,
  alerts_24h: 27,
  alerts_unacknowledged: 3,
  anomalies_24h: 5,
};

type Handler = (query?: Record<string, unknown>, body?: unknown) => unknown;

/** Registry keyed by "METHOD /path" (exact) or "METHOD /prefix/*" patterns. */
const handlers: Record<string, Handler> = {
  'GET /tenants/me': () => ({ data: TENANT_ME }),
  'GET /stats': () => ({ data: STATS }),
};

const LIST_PATHS = [
  '/catalog/products',
  '/targets',
  '/matches',
  '/observations/prices',
  '/forecasts',
  '/anomalies',
  '/reviews',
  '/narratives',
  '/assortment-gaps',
  '/content-gaps',
  '/rules',
  '/rule-decisions',
  '/alerts',
  '/webhook-subscriptions',
  '/api-keys',
  '/audit/fetch-logs',
];

/** Allow phases A3+ to register/override fixtures without touching the client. */
export function registerMock(key: string, handler: Handler): void {
  handlers[key] = handler;
}

export async function mockFetch<T>(
  method: string,
  path: string,
  query?: Record<string, unknown>,
  body?: unknown,
): Promise<T> {
  const key = `${method} ${path}`;

  if (handlers[key]) {
    return handlers[key](query, body) as T;
  }

  // Unregistered GET list endpoints resolve to an empty page so screens render.
  if (method === 'GET' && LIST_PATHS.includes(path)) {
    return emptyPage() as T;
  }

  // Mutations / unknown reads: echo a minimal envelope.
  if (method === 'DELETE') return undefined as T;
  return { data: (body ?? null) as unknown } as T;
}
