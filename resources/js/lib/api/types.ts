// TypeScript mirror of the core (`padosoft/laravel-ai-price-intelligence` v1.1) API
// response shapes consumed by the admin. Hand-written (the core has no OpenAPI export);
// kept in sync with PROJECT.md §7 + the v1.1 controllers.

/** Single-resource envelope: `{ data: T }`. */
export interface Resource<T> {
  data: T;
}

/** Laravel cursor-paginated list envelope. */
export interface CursorPage<T> {
  data: T[];
  path: string;
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
  next_page_url: string | null;
  prev_page_url: string | null;
}

/** RFC-7807 problem+json error body the core returns on auth failures. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

// ---- Identity ----
export interface TenantFeatures {
  review_insight: boolean;
  repricer: boolean;
  ai_act: boolean;
  pii: boolean;
  visual_match: boolean;
  content_gap: boolean;
  forecast: boolean;
  anomaly: boolean;
  narrative: boolean;
  promo_detection: boolean;
  assortment: boolean;
  [key: string]: boolean;
}

export interface TenantMe {
  tenant: { id: number | string; code: string | null; name: string | null };
  features: TenantFeatures;
  abilities: string[];
}

export interface DashboardStats {
  products: number;
  targets_active: number;
  competitors_monitored: number;
  matches_pending: number;
  alerts_24h: number;
  alerts_unacknowledged: number;
  anomalies_24h: number;
}

// ---- Catalog / monitoring ----
export interface Product {
  id: number;
  external_id: string;
  sku: string | null;
  gtin: string | null;
  mpn: string | null;
  brand: string | null;
  model: string | null;
  name: string;
  our_price_cents: number | null;
  currency: string | null;
  base_country: string | null;
}

export type TargetStatus = 'active' | 'paused' | 'stopped';

export interface MonitoringTarget {
  id: number;
  product_id: number;
  country: string;
  locale: string | null;
  frequency_preset: string;
  status: TargetStatus;
  priority: number;
  last_check_at: string | null;
  next_check_at: string | null;
}

export type MatchStatus = 'confirmed' | 'suggested' | 'rejected' | 'dead';

export interface CompetitorProduct {
  id: number;
  monitoring_target_id: number;
  competitor_source_id: number | null;
  url: string;
  external_ref: string | null;
  match_status: MatchStatus;
  match_confidence: number | null;
  match_method: string | null;
  last_seen_at: string | null;
}

/** A monitoring-target reference (id + product_id) with its eager-loaded product, as the
 * core attaches to matches/competitor rows via `target.product`. */
export interface TargetRef {
  id: number;
  product_id?: number;
  product?: Product | null;
}

/** One matcher's contribution in the review evidence breakdown (core `evidence` json). */
export interface MatchEvidence {
  matcher: string;
  label: string;
  score: number;
  /** true = matched, false = no match, null = skipped. */
  matched: boolean | null;
  ai?: boolean;
}

/** A candidate match in the [60,85) confidence band awaiting human review (`GET /matches`). */
export interface MatchProposal {
  id: number;
  monitoring_target_id: number;
  competitor_source_id: number | null;
  candidate_url: string;
  candidate_title: string | null;
  candidate_image_url: string | null;
  candidate_price_cents: number | null;
  candidate_host: string | null;
  evidence: MatchEvidence[] | null;
  confidence: number;
  status: string;
  target?: TargetRef | null;
}

/** Competitor source summary (host/display name) eager-loaded onto a listing. */
export interface CompetitorSourceRef {
  id: number;
  host: string;
  display_name?: string | null;
}

/** A row of `GET /competitor-products` — a confirmed listing with its matched product,
 * source host and latest price observation. */
export interface CompetitorListItem extends CompetitorProduct {
  target?: TargetRef | null;
  source?: CompetitorSourceRef | null;
  latest_price?: PriceObservation | null;
}

// ---- Observations ----
export interface PriceObservation {
  id: number;
  competitor_product_id: number;
  captured_at: string;
  price_cents: number | null;
  currency: string | null;
  price_base_cents: number | null;
  shipping_cents: number | null;
  available: boolean;
}

export interface CompetitorDetail {
  competitor_product: CompetitorListItem;
  latest_price: PriceObservation | null;
  latest_stock: Record<string, unknown> | null;
  latest_promo: Record<string, unknown> | null;
  latest_content: Record<string, unknown> | null;
}

// ---- Intelligence ----
export interface Forecast {
  id: number;
  competitor_product_id: number;
  horizon_days: number;
  forecast_price_cents: number;
  ci_low_cents: number | null;
  ci_high_cents: number | null;
  model_version: string;
  is_ai_generated: boolean;
  generated_at: string;
}

export type Severity = 'low' | 'medium' | 'high';

export interface Anomaly {
  id: number;
  competitor_product_id: number;
  type: string;
  severity: Severity;
  evidence: Record<string, unknown> | null;
  is_ai_generated: boolean;
  detected_at: string;
  acknowledged_at: string | null;
}

export interface ReviewInsight {
  id: number;
  competitor_product_id: number;
  period: string;
  sentiment_score: number;
  themes: Array<Record<string, unknown>> | null;
  sample_count: number;
  is_ai_generated: boolean;
  generated_at: string;
}

/** `GET /reviews` envelope: a cursor page plus the core's `meta.enabled` flag, which is
 * `false` when the review-insight module is disabled for the tenant (vs. simply empty). */
export interface ReviewsPage extends CursorPage<ReviewInsight> {
  meta?: { enabled: boolean };
}

export interface Narrative {
  id: number;
  period: string;
  summary_md: string;
  highlights: Record<string, unknown> | null;
  is_ai_generated: boolean;
  generated_at: string;
}

export interface AssortmentGap {
  id: number;
  competitor_source_id: number | null;
  category_path: string;
  competitor_product_url: string | null;
  title: string | null;
  importance_score: number;
  status: string;
}

export interface ContentGap {
  id: number;
  product_id: number;
  seo_score_delta: number;
  missing_attributes: string[] | null;
  title_recommendations: string[] | null;
  description_recommendations: string[] | null;
  image_count_gap: number;
  generated_at: string;
}

// ---- Pricing ----
export type RuleStrategy =
  | 'match_cheapest'
  | 'beat_top_n'
  | 'undercut_pct'
  | 'match_with_floor'
  | 'dynamic_demand'
  | 'custom';

export interface RepricingRule {
  id: number;
  name: string;
  target_filter: Record<string, unknown> | null;
  strategy: RuleStrategy;
  parameters: Record<string, unknown> | null;
  priority: number;
  status: 'active' | 'paused';
}

export interface RuleDecision {
  id: number;
  repricing_rule_id: number;
  product_id: number;
  current_price_cents: number | null;
  suggested_price_cents: number | null;
  applied: boolean;
  reason: string | null;
}

export interface SimulateDecision {
  product_id: number | null;
  current_price_cents: number | null;
  suggested_price_cents: number | null;
  changed: boolean;
}

export interface SimulateResult {
  rule_id: number;
  strategy: RuleStrategy;
  custom_not_simulated: boolean;
  decisions: SimulateDecision[];
}

// ---- System ----
export interface Alert {
  id: number;
  type: string;
  severity: Severity;
  payload: Record<string, unknown> | null;
  product_id: number | null;
  competitor_product_id: number | null;
  acknowledged_at: string | null;
  read?: boolean;
  created_at: string;
}

export interface WebhookSubscription {
  id: number;
  url: string;
  events: string[] | null;
  active: boolean;
  last_status?: number | null;
  last_at?: string | null;
}

export interface ApiKey {
  id: number;
  name: string;
  scopes: string[] | null;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/** Returned once on creation. */
export interface ApiKeyCreated {
  id: number;
  name: string;
  scopes: string[] | null;
  plaintext: string;
}

export interface FetchLog {
  id: number;
  competitor_source_id: number | null;
  url: string;
  status: number | null;
  latency_ms: number | null;
  robots_allowed: boolean;
  driver: string | null;
  captured_at: string;
}
