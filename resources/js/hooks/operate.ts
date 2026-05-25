import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api/client';
import type {
  Alert,
  Anomaly,
  ApiKey,
  ApiKeyCreated,
  AssortmentGap,
  CompetitorDetail,
  CompetitorListItem,
  CompetitorProduct,
  ContentGap,
  CursorPage,
  FetchLog,
  Forecast,
  MatchProposal,
  MonitoringTarget,
  Narrative,
  PriceObservation,
  Product,
  RepricingRule,
  Resource,
  ReviewsPage,
  RuleDecision,
  SimulateResult,
  TargetStatus,
  TenantMe,
  TenantSettings,
  WebhookSubscription,
} from '@/lib/api/types';

/**
 * Shared optimistic "create into a list" mutation. Prepends a temporary row to every cached
 * cursor-page whose key matches `prefix` (so parameterized lists like `['targets', status]`
 * all update), snapshots them for rollback on error, and re-syncs from the server on settle.
 * The temp row gets a negative id so it never collides with a real one and is trivially
 * distinguishable while in flight.
 */
function useOptimisticCreate<TVars, TItem, TResult>(
  prefix: readonly unknown[],
  mutationFn: (vars: TVars) => Promise<TResult>,
  buildTemp: (vars: TVars) => TItem,
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, TVars, { snapshots: Array<[readonly unknown[], CursorPage<TItem> | undefined]> }>({
    mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: prefix });
      const snapshots = qc.getQueriesData<CursorPage<TItem>>({ queryKey: prefix }) as Array<[readonly unknown[], CursorPage<TItem> | undefined]>;
      const temp = buildTemp(vars);
      qc.setQueriesData<CursorPage<TItem>>({ queryKey: prefix }, (old) =>
        // Only touch cursor-page list caches; a sibling detail query (e.g. the
        // `['competitor-products', id]` single-resource cache) shares the prefix but holds a
        // non-array `data`, so guard against corrupting it.
        old && Array.isArray(old.data) ? { ...old, data: [temp, ...old.data] } : old,
      );
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: prefix }),
  });
}

/** Monotonic source of negative ids for optimistic temp rows (never collides with server ids). */
let tempIdSeq = -1;
function nextTempId(): number { return tempIdSeq--; }

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: () => api.get<CursorPage<Product>>('/catalog/products'),
  });
}

/** Payload for creating a single SKU (POST /catalog/products:bulk with a one-item batch). */
export interface NewSkuInput {
  external_id: string;
  name: string;
  sku?: string;
  brand?: string;
  our_price_cents?: number;
  currency?: string;
  base_country?: string;
}

/**
 * Catalog write actions. `createSku` optimistically prepends the new product to the cached
 * catalog page (rollback on error) and posts a one-item bulk batch; `importCsv` uploads a
 * multipart CSV file and re-syncs the catalog on completion.
 */
export function useCatalogActions() {
  const qc = useQueryClient();

  const createSku = useOptimisticCreate<NewSkuInput, Product, { data: { upserted: number } }>(
    ['catalog', 'products'],
    (input) => api.post<{ data: { upserted: number } }>('/catalog/products:bulk', { products: [input] }),
    (input) => ({
      id: nextTempId(),
      external_id: input.external_id,
      sku: input.sku ?? null,
      gtin: null,
      mpn: null,
      brand: input.brand ?? null,
      model: null,
      name: input.name,
      our_price_cents: input.our_price_cents ?? null,
      currency: input.currency ?? null,
      base_country: input.base_country ?? null,
    }),
  );

  const importCsv = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<{ data: { imported: number } }>('/catalog/products:csv', form);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['catalog', 'products'] }),
  });

  return { createSku, importCsv };
}

export function useTargets(status?: TargetStatus | 'all') {
  return useQuery({
    queryKey: ['targets', status ?? 'all'],
    queryFn: () =>
      api.get<CursorPage<MonitoringTarget>>('/targets', status && status !== 'all' ? { status } : undefined),
  });
}

export function useAlerts(limit?: number) {
  return useQuery({
    queryKey: ['alerts', { limit }],
    queryFn: () => api.get<CursorPage<Alert>>('/alerts', limit ? { per_page: limit } : undefined),
  });
}

export function useAnomalies(limit?: number) {
  return useQuery({
    queryKey: ['anomalies', { limit }],
    queryFn: () => api.get<CursorPage<Anomaly>>('/anomalies', limit ? { per_page: limit } : undefined),
  });
}

export function usePriceSeries(host: string, productId?: number | null, range?: string) {
  return useQuery({
    // Key by the values actually sent (range omitted from the request → null in the key)
    // so the cache entry matches the response, with no phantom default.
    queryKey: ['observations', 'prices', host, productId ?? null, range ?? null],
    queryFn: () =>
      api.get<CursorPage<PriceObservation>>('/observations/prices', {
        host,
        ...(productId != null ? { product_id: productId } : {}),
        ...(range ? { range } : {}),
      }),
  });
}

/** Price observation series for a single competitor listing (Competitor Detail price tab).
 * Disabled for non-positive ids (sentinel "no selection" value) to avoid spurious requests. */
export function useCompetitorPrices(competitorProductId: number) {
  return useQuery({
    queryKey: ['observations', 'prices', 'cp', competitorProductId],
    queryFn: () =>
      api.get<CursorPage<PriceObservation>>('/observations/prices', { competitor_product_id: competitorProductId }),
    enabled: competitorProductId > 0,
  });
}

/** Pending match proposals (the [60,85) human-review queue). */
export function useMatches(status: string = 'pending') {
  return useQuery({
    queryKey: ['matches', status],
    queryFn: () => api.get<CursorPage<MatchProposal>>('/matches', { status }),
  });
}

/**
 * Approve / reject a match proposal. Both invalidate the matches queue; the swipe deck
 * advances optimistically on its own and only relies on these for server persistence.
 */
export function useMatchActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['matches'] });

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/matches/${id}/approve`),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/matches/${id}/reject`),
    onSuccess: invalidate,
  });

  return { approve, reject };
}

/** Confirmed competitor listings, optionally narrowed by host and/or matched product
 * (both filters are applied server-side by the core, so large catalogs page correctly). */
export function useCompetitors(host?: string, productId?: number | null) {
  return useQuery({
    queryKey: ['competitor-products', { host: host ?? 'all', productId: productId ?? null }],
    queryFn: () =>
      api.get<CursorPage<CompetitorListItem>>('/competitor-products', {
        ...(host ? { host } : {}),
        ...(productId != null ? { product_id: productId } : {}),
      }),
  });
}

/** Single competitor listing detail (header + latest price/stock/promo/content snapshots).
 * Disabled for non-positive ids (e.g. navigated without a competitor selected). */
export function useCompetitorDetail(id: number) {
  return useQuery({
    queryKey: ['competitor-products', id],
    queryFn: () => api.get<Resource<CompetitorDetail>>(`/competitor-products/${id}`).then(unwrap),
    enabled: id > 0,
  });
}

/** Payload for manually attaching a competitor listing by URL (POST /competitor-products). */
export interface AddCompetitorInput {
  monitoring_target_id: number;
  url: string;
  external_ref?: string;
}

/**
 * Competitor listing actions. `addByUrl` optimistically prepends the new (manual, confidence
 * 100) listing to every cached competitor-products page and rolls back on error; `discover`
 * queues background URL discovery for a target (no synchronous list change).
 */
export function useCompetitorActions() {
  const addByUrl = useOptimisticCreate<AddCompetitorInput, CompetitorListItem, { data: CompetitorProduct }>(
    ['competitor-products'],
    (input) => api.post<{ data: CompetitorProduct }>('/competitor-products', input),
    (input) => ({
      id: nextTempId(),
      monitoring_target_id: input.monitoring_target_id,
      competitor_source_id: null,
      url: input.url,
      external_ref: input.external_ref ?? null,
      match_status: 'confirmed',
      match_confidence: 100,
      match_method: 'manual',
      last_seen_at: null,
      target: null,
      source: null,
      latest_price: null,
    }),
  );

  const discover = useMutation({
    mutationFn: (targetId: number) => api.post<{ data: { queued: boolean } }>(`/targets/${targetId}/discover:now`),
  });

  return { addByUrl, discover };
}

// ---- Intelligence (A5) ----

/** Price forecasts (statistical model + confidence interval). */
export function useForecasts() {
  return useQuery({
    queryKey: ['forecasts'],
    queryFn: () => api.get<CursorPage<Forecast>>('/forecasts'),
  });
}

/** Weekly AI narrative digests; optionally a specific ISO week period. */
export function useNarratives(period?: string) {
  return useQuery({
    queryKey: ['narratives', period ?? 'latest'],
    queryFn: () => api.get<CursorPage<Narrative>>('/narratives', period ? { period } : undefined),
  });
}

/** Assortment gaps — categories where competitors list SKUs we don't. */
export function useAssortmentGaps() {
  return useQuery({
    queryKey: ['assortment-gaps'],
    queryFn: () => api.get<CursorPage<AssortmentGap>>('/assortment-gaps'),
  });
}

/** Per-product content/SEO gap analysis. */
export function useContentGaps() {
  return useQuery({
    queryKey: ['content-gaps'],
    queryFn: () => api.get<CursorPage<ContentGap>>('/content-gaps'),
  });
}

/** GDPR-safe aggregated review sentiment (feature-gated by review_insight). The response
 * carries `meta.enabled` so the screen can distinguish "module off" from "no data". */
export function useReviews(period?: string) {
  return useQuery({
    queryKey: ['reviews', period ?? 'all'],
    queryFn: () => api.get<ReviewsPage>('/reviews', period ? { period } : undefined),
  });
}

/** Recent HTTP fetch audit log (Competitor Detail audit tab + the Audit screen). */
export function useFetchLogs(limit?: number) {
  return useQuery({
    queryKey: ['audit', 'fetch-logs', { limit }],
    queryFn: () => api.get<CursorPage<FetchLog>>('/audit/fetch-logs', limit ? { per_page: limit } : undefined),
  });
}

// ---- System (A6) ----

/** Repricing rules (advisory-only engine). */
export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => api.get<CursorPage<RepricingRule>>('/rules', { per_page: 100 }),
  });
}

/** Recent repricing decisions (the rule-decisions log). */
export function useRuleDecisions() {
  return useQuery({
    queryKey: ['rule-decisions'],
    queryFn: () => api.get<CursorPage<RuleDecision>>('/rule-decisions', { per_page: 100 }),
  });
}

/** Dry-run a rule against sample SKUs (no persistence, no webhooks). */
export function useRuleActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['rules'] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'paused' }) =>
      api.patch<{ data: RepricingRule }>(`/rules/${id}`, { status }).then(unwrap),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/rules/${id}`),
    onSuccess: invalidate,
  });
  const simulate = useMutation({
    mutationFn: ({ id, samples }: { id: number; samples: unknown[] }) =>
      api.post<Resource<SimulateResult>>(`/rules/${id}/simulate`, { samples }).then(unwrap),
  });

  return { setStatus, remove, simulate };
}

/** Webhook subscriptions. */
export function useWebhooks() {
  return useQuery({
    queryKey: ['webhook-subscriptions'],
    queryFn: () => api.get<CursorPage<WebhookSubscription>>('/webhook-subscriptions', { per_page: 100 }),
  });
}

export function useWebhookActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
  const test = useMutation({
    mutationFn: (id: number) => api.post(`/webhook-subscriptions/${id}/test`),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/webhook-subscriptions/${id}`),
    onSuccess: invalidate,
  });
  return { test, remove };
}

/** API keys (admin-scoped: apikeys:manage). Pass `enabled=false` when the caller lacks the
 * ability so the request never fires. */
export function useApiKeys(enabled: boolean = true) {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get<CursorPage<ApiKey>>('/api-keys', { per_page: 100 }),
    enabled,
  });
}

export function useApiKeyActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['api-keys'] });
  const create = useMutation({
    mutationFn: (payload: { name: string; scopes: string[] }) =>
      api.post<Resource<ApiKeyCreated>>('/api-keys', payload).then(unwrap),
    onSuccess: invalidate,
  });
  const revoke = useMutation({
    mutationFn: (id: number) => api.delete(`/api-keys/${id}`),
    onSuccess: invalidate,
  });
  return { create, revoke };
}

/** Acknowledge an alert. */
export function useAlertActions() {
  const qc = useQueryClient();
  const ack = useMutation({
    mutationFn: (id: number) => api.post(`/alerts/${id}/ack`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
  return { ack };
}

/**
 * Target actions. `scrapeNow` only queues background jobs (the list doesn't change
 * synchronously, so it doesn't invalidate); `setStatus` mutates the row and invalidates
 * the targets list on success.
 */
/** Payload for creating a monitoring target (POST /targets). */
export interface NewTargetInput {
  product_id: number;
  country: string;
  frequency?: string;
  priority?: number;
}

export function useTargetActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['targets'] });

  const scrapeNow = useMutation({
    mutationFn: (id: number) => api.post<{ data: { queued: number } }>(`/targets/${id}/scrape:now`),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TargetStatus }) =>
      api.patch<{ data: MonitoringTarget }>(`/targets/${id}`, { status }).then(unwrap),
    onSuccess: invalidate,
  });

  const create = useOptimisticCreate<NewTargetInput, MonitoringTarget, { data: MonitoringTarget }>(
    ['targets'],
    (input) => api.post<{ data: MonitoringTarget }>('/targets', input),
    (input) => ({
      id: nextTempId(),
      product_id: input.product_id,
      country: input.country.toUpperCase(),
      locale: null,
      frequency_preset: input.frequency ?? 'daily',
      status: 'active',
      priority: input.priority ?? 100,
      last_check_at: null,
      next_check_at: null,
    }),
  );

  return { scrapeNow, setStatus, create };
}

/**
 * Write a partial tenant-settings patch (PATCH /tenants/me/settings). Optimistically merges
 * the patch into the cached `['tenants','me']` identity so the form reflects the change
 * immediately, rolls back on error, and re-syncs from the server on settle.
 */
export function useUpdateSettings() {
  const qc = useQueryClient();
  const key = ['tenants', 'me'] as const;

  return useMutation({
    mutationFn: (settings: TenantSettings) =>
      api.patch<{ data: { settings: TenantSettings } }>('/tenants/me/settings', { settings }).then(unwrap),
    onMutate: async (settings: TenantSettings) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TenantMe>(key);
      if (previous) {
        qc.setQueryData<TenantMe>(key, {
          ...previous,
          tenant: { ...previous.tenant, settings: { ...previous.tenant.settings, ...settings } },
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
