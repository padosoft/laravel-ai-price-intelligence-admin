import { ApiError } from './errors';
import type { CursorPage, DashboardStats, TenantMe } from './types';
import {
  ALERTS,
  ANOMALIES,
  API_KEYS,
  ASSORTMENT_GAPS,
  COMPETITOR_LIST,
  CONTENT_GAPS,
  FORECASTS,
  MATCH_PROPOSALS,
  NARRATIVES,
  PRICE_SERIES,
  PRICE_SERIES_BY_CP,
  PRODUCTS,
  REVIEWS,
  RULE_DECISIONS,
  RULES,
  TARGETS,
  WEBHOOKS,
} from './fixtures';

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

/**
 * Tracks match proposal IDs that have been approved/rejected in the current mock session.
 * Exported so tests can reset between cases.
 */
export const processedMatchIds = new Set<number>();
export function resetMatchMocks(): void { processedMatchIds.clear(); }

/** Registry keyed by "METHOD /path" (exact) or "METHOD /prefix/*" patterns. */
const handlers: Record<string, Handler> = {
  'GET /tenants/me': () => ({ data: TENANT_ME }),
  'GET /stats': () => ({ data: STATS }),
  'GET /catalog/products': () => page(PRODUCTS),
  'GET /targets': (query) => {
    const status = query?.status as string | undefined;
    return page(status ? TARGETS.filter((t) => t.status === status) : TARGETS);
  },
  'GET /alerts': () => page(ALERTS),
  'GET /anomalies': () => page(ANOMALIES),
  'GET /observations/prices': (query) => {
    const cpId = query?.competitor_product_id != null ? Number(query.competitor_product_id) : null;
    if (cpId != null) {
      return page(PRICE_SERIES_BY_CP[cpId] ?? []);
    }
    const host = (query?.host as string | undefined) ?? 'amazon.it';
    return page(PRICE_SERIES[host] ?? PRICE_SERIES['amazon.it']);
  },
  'GET /matches': (query) => {
    const status = (query?.status as string | undefined) ?? 'pending';
    return page(
      MATCH_PROPOSALS.filter((m) =>
        m.status === status && (status !== 'pending' || !processedMatchIds.has(m.id)),
      ),
    );
  },
  'GET /rules': () => page(RULES),
  'GET /rule-decisions': () => page(RULE_DECISIONS),
  'GET /webhook-subscriptions': () => page(WEBHOOKS),
  'GET /api-keys': () => page(API_KEYS),
  'GET /forecasts': () => page(FORECASTS),
  'GET /narratives': (query) => {
    const period = query?.period as string | undefined;
    return page(period ? NARRATIVES.filter((n) => n.period === period) : NARRATIVES);
  },
  'GET /assortment-gaps': () => page(ASSORTMENT_GAPS),
  'GET /content-gaps': () => page(CONTENT_GAPS),
  'GET /reviews': (query) => {
    const period = query?.period as string | undefined;
    const data = period ? REVIEWS.filter((r) => r.period === period) : REVIEWS;
    return { ...page(data), meta: { enabled: true } };
  },
  'GET /competitor-products': (query) => {
    const host = query?.host as string | undefined;
    const productId = query?.product_id != null ? Number(query.product_id) : undefined;
    return page(
      COMPETITOR_LIST.filter(
        (c) => (host ? c.source?.host === host : true) && (productId != null ? c.target?.product_id === productId : true),
      ),
    );
  },
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

  // Dynamic action paths.
  if (method === 'POST' && /^\/targets\/\d+\/scrape:now$/.test(path)) {
    return { data: { queued: 2 } } as T;
  }
  const cpDetail = method === 'GET' && path.match(/^\/competitor-products\/(\d+)$/);
  if (cpDetail) {
    const id = Number(cpDetail[1]);
    const cp = COMPETITOR_LIST.find((c) => c.id === id);
    // Mirror the core's findOrFail: an unknown id is a 404, not a silent fall-through to
    // the first listing. Throw an ApiError(404) so the QueryClient retry policy skips it
    // (it only retries 5xx) instead of retrying a deterministic not-found.
    if (!cp) throw new ApiError(404, null, 'HTTP 404: competitor product not found');
    return {
      data: {
        competitor_product: cp,
        latest_price: cp.latest_price ?? null,
        latest_stock: null,
        latest_promo: null,
        latest_content: null,
      },
    } as T;
  }
  if (method === 'POST' && path === '/api-keys') {
    const b = (body ?? {}) as { name?: string; scopes?: string[] };
    return { data: { id: Math.floor(Math.random() * 100000), name: b.name ?? 'New key', scopes: b.scopes ?? [], plaintext: `piprice_${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}` } } as T;
  }
  if (method === 'POST' && /^\/matches\/\d+\/(approve|reject)$/.test(path)) {
    const id = Number(path.split('/')[2]);
    processedMatchIds.add(id);
    return (path.endsWith('approve') ? { data: { match_status: 'confirmed' } } : undefined) as T;
  }
  if (method === 'POST' && /^\/rules\/\d+\/simulate$/.test(path)) {
    return { data: { rule_id: 0, strategy: 'undercut_pct', custom_not_simulated: false, decisions: [] } } as T;
  }
  const targetPatch = method === 'PATCH' && path.match(/^\/targets\/(\d+)$/);
  if (targetPatch) {
    const id = Number(targetPatch[1]);
    const base = TARGETS.find((t) => t.id === id) ?? TARGETS[0];
    return { data: { ...base, id, ...(body as object) } } as T;
  }

  // Unregistered GET list endpoints resolve to an empty page so screens render.
  if (method === 'GET' && LIST_PATHS.includes(path)) {
    return emptyPage() as T;
  }

  // Mutations / unknown reads: echo a minimal envelope.
  if (method === 'DELETE') return undefined as T;
  return { data: (body ?? null) as unknown } as T;
}
