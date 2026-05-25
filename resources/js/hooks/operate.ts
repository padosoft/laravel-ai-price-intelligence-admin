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
  WebhookSubscription,
} from '@/lib/api/types';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: () => api.get<CursorPage<Product>>('/catalog/products'),
  });
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
    queryFn: () => api.get<CursorPage<RepricingRule>>('/rules'),
  });
}

/** Recent repricing decisions (the rule-decisions log). */
export function useRuleDecisions() {
  return useQuery({
    queryKey: ['rule-decisions'],
    queryFn: () => api.get<CursorPage<RuleDecision>>('/rule-decisions'),
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
    queryFn: () => api.get<CursorPage<WebhookSubscription>>('/webhook-subscriptions'),
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

/** API keys (admin-scoped: apikeys:manage). */
export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get<CursorPage<ApiKey>>('/api-keys'),
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

  return { scrapeNow, setStatus };
}
