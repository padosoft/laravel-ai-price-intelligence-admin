import { ApiError } from './errors';
import type { CursorPage, DashboardStats, TenantMe, TenantSettings } from './types';
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

const TENANT_SETTINGS_SEED: TenantSettings = {
  alert_email: 'pricing-ops@acme.it',
  density: 'comfortable',
  channels: { webhook: true, mail: true, slack: false, teams: false },
};

const TENANT_ME: TenantMe = {
  tenant: { id: 'acme-it', code: 'ACME', name: 'Acme Italia', settings: { ...TENANT_SETTINGS_SEED } },
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

/**
 * Mutable in-memory state for the new A6 resources so mutations are reflected in
 * subsequent GET requests during the same mock session. Exported reset helpers let
 * tests restore fixture state between cases.
 */
let mockAlerts = ALERTS.map((a) => ({ ...a }));
let mockRules = RULES.map((r) => ({ ...r }));
let mockWebhooks = WEBHOOKS.map((w) => ({ ...w }));
let mockApiKeys = API_KEYS.map((k) => ({ ...k }));
let mockTargets = TARGETS.map((t) => ({ ...t }));
let mockCompetitors = COMPETITOR_LIST.map((c) => ({ ...c }));
let mockProducts = PRODUCTS.map((p) => ({ ...p }));
let mockTenantSettings: TenantSettings = { ...TENANT_SETTINGS_SEED, channels: { ...TENANT_SETTINGS_SEED.channels } };
let apiKeySeq = 90000;
function nextApiKeyId(): number { return ++apiKeySeq; }
let resourceSeq = 800000;
/** Monotonic id for newly created mock resources (targets/rules/webhooks/competitor-products). */
function nextResourceId(): number { return ++resourceSeq; }

export function resetMockState(): void {
  processedMatchIds.clear();
  mockAlerts = ALERTS.map((a) => ({ ...a }));
  mockRules = RULES.map((r) => ({ ...r }));
  mockWebhooks = WEBHOOKS.map((w) => ({ ...w }));
  mockApiKeys = API_KEYS.map((k) => ({ ...k }));
  mockTargets = TARGETS.map((t) => ({ ...t }));
  mockCompetitors = COMPETITOR_LIST.map((c) => ({ ...c }));
  mockProducts = PRODUCTS.map((p) => ({ ...p }));
  mockTenantSettings = { ...TENANT_SETTINGS_SEED, channels: { ...TENANT_SETTINGS_SEED.channels } };
  apiKeySeq = 90000;
  resourceSeq = 800000;
}

/** Registry keyed by "METHOD /path" (exact) or "METHOD /prefix/*" patterns. */
const handlers: Record<string, Handler> = {
  'GET /tenants/me': () => ({
    data: { ...TENANT_ME, tenant: { ...TENANT_ME.tenant, settings: mockTenantSettings } },
  }),
  'PATCH /tenants/me/settings': (_query, body) => {
    const patch = ((body as { settings?: TenantSettings } | undefined)?.settings) ?? {};
    // Mirror the core: shallow-merge the patch into the stored settings.
    mockTenantSettings = { ...mockTenantSettings, ...patch };
    return { data: { settings: mockTenantSettings } };
  },
  'GET /stats': () => ({ data: STATS }),
  'GET /catalog/products': () => page(mockProducts),
  'POST /catalog/products:bulk': (_query, body) => {
    const items = ((body as { products?: Array<Record<string, unknown>> } | undefined)?.products) ?? [];
    for (const it of items) {
      mockProducts = [{
        id: nextResourceId(),
        external_id: String(it.external_id ?? ''),
        sku: (it.sku as string | undefined) ?? null,
        gtin: (it.gtin as string | undefined) ?? null,
        mpn: (it.mpn as string | undefined) ?? null,
        brand: (it.brand as string | undefined) ?? null,
        model: (it.model as string | undefined) ?? null,
        name: String(it.name ?? ''),
        our_price_cents: (it.our_price_cents as number | undefined) ?? null,
        currency: (it.currency as string | undefined) ?? null,
        base_country: (it.base_country as string | undefined) ?? null,
      }, ...mockProducts];
    }
    return { data: { upserted: items.length } };
  },
  'POST /catalog/products:csv': () => {
    // The real core parses the uploaded file; the mock just acknowledges a fixed import count
    // (FormData bodies aren't introspected here) so the screen flow + invalidation are exercised.
    return { data: { imported: 0 } };
  },
  'GET /targets': (query) => {
    const status = query?.status as string | undefined;
    return page(status ? mockTargets.filter((t) => t.status === status) : mockTargets);
  },
  'POST /targets': (_query, body) => {
    const b = (body ?? {}) as { product_id?: number; country?: string; frequency?: string; priority?: number };
    const target = {
      id: nextResourceId(),
      product_id: b.product_id ?? 0,
      country: (b.country ?? 'IT').toUpperCase(),
      locale: null,
      frequency_preset: b.frequency ?? 'daily',
      status: 'active' as const,
      priority: b.priority ?? 100,
      last_check_at: null,
      next_check_at: new Date().toISOString(),
    };
    mockTargets = [target, ...mockTargets];
    return { data: target };
  },
  'GET /alerts': () => page(mockAlerts),
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
  'GET /rules': () => page(mockRules),
  'GET /rule-decisions': () => page(RULE_DECISIONS),
  'GET /webhook-subscriptions': () => page(mockWebhooks),
  'GET /api-keys': () => page(mockApiKeys),
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
      mockCompetitors.filter(
        (c) => (host ? c.source?.host === host : true) && (productId != null ? c.target?.product_id === productId : true),
      ),
    );
  },
  'POST /competitor-products': (_query, body) => {
    const b = (body ?? {}) as { monitoring_target_id?: number; url?: string; external_ref?: string };
    const competitor = {
      id: nextResourceId(),
      monitoring_target_id: b.monitoring_target_id ?? 0,
      competitor_source_id: null,
      url: b.url ?? '',
      external_ref: b.external_ref ?? null,
      match_status: 'confirmed' as const,
      match_confidence: 100,
      match_method: 'manual',
      last_seen_at: new Date().toISOString(),
      source: null,
      target: null,
      latest_price: null,
    };
    mockCompetitors = [competitor, ...mockCompetitors];
    return { data: competitor };
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
  // Trigger competitor-URL discovery for a target (queued background job, 202 in the core).
  if (method === 'POST' && /^\/targets\/\d+\/discover:now$/.test(path)) {
    return { data: { queued: true } } as T;
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
    // Deterministic id/plaintext (monotonic counter) so mock behaviour and tests are stable.
    const id = nextApiKeyId();
    const plaintext = `piprice_mock${String(id).padStart(8, '0')}`;
    // The stored key never holds the plaintext (mirrors the core: the secret is returned
    // once in the POST response and is not retrievable afterwards).
    mockApiKeys.push({ id, name: b.name ?? 'New key', scopes: b.scopes ?? [], last_used_at: null, expires_at: null, revoked_at: null, created_at: '2026-05-25T00:00:00Z' });
    return { data: { id, name: b.name ?? 'New key', scopes: b.scopes ?? [], plaintext } } as T;
  }
  // Revoke API key
  const apiKeyDelete = method === 'DELETE' && path.match(/^\/api-keys\/(\d+)$/);
  if (apiKeyDelete) {
    const id = Number(apiKeyDelete[1]);
    const key = mockApiKeys.find((k) => k.id === id);
    if (key) key.revoked_at = new Date().toISOString();
    return undefined as T;
  }
  if (method === 'POST' && /^\/matches\/\d+\/(approve|reject)$/.test(path)) {
    const id = Number(path.split('/')[2]);
    processedMatchIds.add(id);
    return (path.endsWith('approve') ? { data: { match_status: 'confirmed' } } : undefined) as T;
  }
  // Acknowledge alert
  const alertAck = method === 'POST' && path.match(/^\/alerts\/(\d+)\/ack$/);
  if (alertAck) {
    const id = Number(alertAck[1]);
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) alert.acknowledged_at = new Date().toISOString();
    return undefined as T;
  }
  // Update rule (pause/activate)
  const rulePatch = method === 'PATCH' && path.match(/^\/rules\/(\d+)$/);
  if (rulePatch) {
    const id = Number(rulePatch[1]);
    const rule = mockRules.find((r) => r.id === id);
    if (rule) Object.assign(rule, body as object);
    return { data: rule ?? {} } as T;
  }
  // Delete rule
  const ruleDelete = method === 'DELETE' && path.match(/^\/rules\/(\d+)$/);
  if (ruleDelete) {
    const id = Number(ruleDelete[1]);
    mockRules = mockRules.filter((r) => r.id !== id);
    return undefined as T;
  }
  // Test webhook (fire-and-forget)
  if (method === 'POST' && /^\/webhook-subscriptions\/\d+\/test$/.test(path)) {
    return { data: { queued: true } } as T;
  }
  // Delete webhook subscription
  const webhookDelete = method === 'DELETE' && path.match(/^\/webhook-subscriptions\/(\d+)$/);
  if (webhookDelete) {
    const id = Number(webhookDelete[1]);
    mockWebhooks = mockWebhooks.filter((w) => w.id !== id);
    return undefined as T;
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
