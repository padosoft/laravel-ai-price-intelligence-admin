// Dev/test fixtures shaped to the core v1.1 API types. Used by the mock layer only
// (useMocks) so screens render without a live backend. Not shipped behavior.
import type {
  AiDecision,
  Alert,
  Anomaly,
  ApiKey,
  AssortmentGap,
  CompetitorListItem,
  CompetitorProduct,
  ContentGap,
  Forecast,
  MatchProposal,
  MonitoringTarget,
  Narrative,
  PriceObservation,
  Product,
  RepricingRule,
  ReviewInsight,
  RuleDecision,
  WebhookSubscription,
} from './types';

export const PRODUCTS: Product[] = [
  { id: 1, external_id: 'ACX1P-128', sku: 'ACX1P-128', gtin: '8001234567890', mpn: 'X1P128', brand: 'Acme', model: 'X1 Pro 128GB', name: 'Acme X1 Pro 128GB Smartphone', our_price_cents: 79900, currency: 'EUR', base_country: 'IT' },
  { id: 2, external_id: 'ACX1-64', sku: 'ACX1-64', gtin: '8001234567906', mpn: 'X164', brand: 'Acme', model: 'X1 64GB', name: 'Acme X1 64GB Smartphone', our_price_cents: 19900, currency: 'EUR', base_country: 'IT' },
  { id: 3, external_id: 'NOVA-OLED55', sku: 'NOVA-OLED55', gtin: '8009876543210', mpn: 'OLED55', brand: 'Nova', model: 'OLED 55"', name: 'Nova OLED 55" 4K TV', our_price_cents: 129900, currency: 'EUR', base_country: 'IT' },
  { id: 4, external_id: 'ZEN-BUDS', sku: 'ZEN-BUDS', gtin: '8005555555555', mpn: 'ZBUDS', brand: 'Zen', model: 'Buds Pro', name: 'Zen Buds Pro Wireless', our_price_cents: 14900, currency: 'EUR', base_country: 'IT' },
];

export const TARGETS: MonitoringTarget[] = [
  { id: 101, product_id: 1, country: 'IT', locale: 'it-IT', frequency_preset: 'daily', status: 'active', priority: 10, last_check_at: '2026-05-24T18:10:00Z', next_check_at: '2026-05-25T06:00:00Z' },
  { id: 102, product_id: 1, country: 'DE', locale: 'de-DE', frequency_preset: 'daily', status: 'active', priority: 20, last_check_at: '2026-05-24T17:40:00Z', next_check_at: '2026-05-25T05:30:00Z' },
  { id: 103, product_id: 3, country: 'IT', locale: 'it-IT', frequency_preset: '4h', status: 'paused', priority: 50, last_check_at: '2026-05-24T12:00:00Z', next_check_at: null },
  { id: 104, product_id: 4, country: 'IT', locale: 'it-IT', frequency_preset: 'hourly', status: 'active', priority: 30, last_check_at: '2026-05-24T18:25:00Z', next_check_at: '2026-05-24T19:25:00Z' },
];

const productById = (id: number): Product => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

/** Confirmed competitor listings for the Competitors screen (`GET /competitor-products`). */
export const COMPETITOR_LIST: CompetitorListItem[] = [
  { id: 5001, monitoring_target_id: 101, competitor_source_id: 1, url: 'https://amazon.it/dp/B0XYZ', external_ref: 'B0XYZ', match_status: 'confirmed', match_confidence: 98, match_method: 'gtin', last_seen_at: '2026-05-24T18:10:00Z', source: { id: 1, host: 'amazon.it', display_name: 'Amazon IT' }, target: { id: 101, product_id: 1, product: productById(1) }, latest_price: { id: 1, competitor_product_id: 5001, captured_at: '2026-05-24T18:10:00Z', price_cents: 76900, currency: 'EUR', price_base_cents: 76900, shipping_cents: 0, available: true } },
  { id: 5002, monitoring_target_id: 101, competitor_source_id: 2, url: 'https://mediaworld.it/p/123', external_ref: null, match_status: 'confirmed', match_confidence: 94, match_method: 'mpn', last_seen_at: '2026-05-24T18:05:00Z', source: { id: 2, host: 'mediaworld.it', display_name: 'MediaWorld' }, target: { id: 101, product_id: 1, product: productById(1) }, latest_price: { id: 2, competitor_product_id: 5002, captured_at: '2026-05-24T18:05:00Z', price_cents: 78900, currency: 'EUR', price_base_cents: 78900, shipping_cents: 0, available: true } },
  { id: 5003, monitoring_target_id: 101, competitor_source_id: 7, url: 'https://trovaprezzi.it/x', external_ref: null, match_status: 'confirmed', match_confidence: 76, match_method: 'llm_judge', last_seen_at: '2026-05-24T17:50:00Z', source: { id: 7, host: 'trovaprezzi.it', display_name: 'Trovaprezzi' }, target: { id: 101, product_id: 1, product: productById(1) }, latest_price: { id: 3, competitor_product_id: 5003, captured_at: '2026-05-24T17:50:00Z', price_cents: 74900, currency: 'EUR', price_base_cents: 74900, shipping_cents: 0, available: true } },
  { id: 5004, monitoring_target_id: 103, competitor_source_id: 1, url: 'https://amazon.it/dp/B0TV', external_ref: 'B0TV', match_status: 'confirmed', match_confidence: 99, match_method: 'gtin', last_seen_at: '2026-05-24T16:00:00Z', source: { id: 1, host: 'amazon.it', display_name: 'Amazon IT' }, target: { id: 103, product_id: 3, product: productById(3) }, latest_price: { id: 4, competitor_product_id: 5004, captured_at: '2026-05-24T16:00:00Z', price_cents: 124900, currency: 'EUR', price_base_cents: 124900, shipping_cents: 0, available: true } },
  { id: 5005, monitoring_target_id: 104, competitor_source_id: 2, url: 'https://mediaworld.it/p/zenbuds', external_ref: null, match_status: 'confirmed', match_confidence: 91, match_method: 'name', last_seen_at: '2026-05-24T18:25:00Z', source: { id: 2, host: 'mediaworld.it', display_name: 'MediaWorld' }, target: { id: 104, product_id: 4, product: productById(4) }, latest_price: { id: 5, competitor_product_id: 5005, captured_at: '2026-05-24T18:25:00Z', price_cents: 15900, currency: 'EUR', price_base_cents: 15900, shipping_cents: 0, available: false } },
];

/** Pending match proposals for the review swipe deck (`GET /matches`). */
export const MATCH_PROPOSALS: MatchProposal[] = [
  {
    id: 9101, monitoring_target_id: 101, competitor_source_id: null,
    candidate_url: 'https://bpm-power.com/cellulari/acme-x1-pro-128gb-bk',
    candidate_title: 'Acme X1 Pro 5G 128GB - Smartphone Mezzanotte Black',
    candidate_image_url: null, candidate_price_cents: 77900, candidate_host: 'bpm-power.com',
    confidence: 78, status: 'pending', target: { id: 101, product_id: 1, product: productById(1) },
    evidence: [
      { matcher: 'GTIN exact', score: 0, matched: false, label: 'No GTIN/EAN exposed on listing' },
      { matcher: 'MPN + Brand', score: 100, matched: true, label: 'Brand "Acme" + MPN "X1-128" detected' },
      { matcher: 'Name (Jaro)', score: 82, matched: true, label: 'Jaro-Winkler 0.82 · token overlap 0.71' },
      { matcher: 'Embedding', score: 88, matched: true, label: 'Cosine 0.88 (text-embedding-3-small)' },
      { matcher: 'Visual (vision)', score: 76, matched: true, label: 'GPT-4o-mini · same product, different angle', ai: true },
      { matcher: 'LLM judge', score: 78, matched: true, label: 'Borderline → invoked. Verdict: same SKU, conf 78', ai: true },
    ],
  },
  {
    id: 9102, monitoring_target_id: 104, competitor_source_id: null,
    candidate_url: 'https://amazon.it/dp/B0AP3PRO99',
    candidate_title: 'Acme AirBuds 3 Pro Auricolari Wireless Cancellazione Rumore',
    candidate_image_url: null, candidate_price_cents: 16900, candidate_host: 'amazon.it',
    confidence: 71, status: 'pending', target: { id: 104, product_id: 4, product: productById(4) },
    evidence: [
      { matcher: 'GTIN exact', score: 0, matched: false, label: 'GTIN mismatch (different variant?)' },
      { matcher: 'MPN + Brand', score: 60, matched: false, label: 'Brand "Acme" ✓ · MPN "AP3-PRO" ≠ "AP3"' },
      { matcher: 'Name (Jaro)', score: 72, matched: true, label: 'Jaro-Winkler 0.72 · "Pro" suffix differs' },
      { matcher: 'Embedding', score: 81, matched: true, label: 'Cosine 0.81 (text-embedding-3-small)' },
      { matcher: 'Visual (vision)', score: 65, matched: true, label: 'Different case color, same form factor', ai: true },
      { matcher: 'LLM judge', score: 71, matched: true, label: 'Likely a variant. Recommend human review.', ai: true },
    ],
  },
  {
    id: 9103, monitoring_target_id: 103, competitor_source_id: null,
    candidate_url: 'https://idealo.it/prezzi/nova-oled-55',
    candidate_title: 'Nova OLED 55" 4K Smart TV - prezzi e offerte',
    candidate_image_url: null, candidate_price_cents: 123900, candidate_host: 'idealo.it',
    confidence: 83, status: 'pending', target: { id: 103, product_id: 3, product: productById(3) },
    evidence: [
      { matcher: 'GTIN exact', score: 0, matched: false, label: 'Aggregator page, no single GTIN' },
      { matcher: 'MPN + Brand', score: 95, matched: true, label: 'Brand + Model "OLED 55" match' },
      { matcher: 'Name (Jaro)', score: 89, matched: true, label: 'Jaro-Winkler 0.89 · high token overlap' },
      { matcher: 'Embedding', score: 90, matched: true, label: 'Cosine 0.90' },
      { matcher: 'Visual (vision)', score: 0, matched: null, label: 'Skipped — aggregator card image is a render' },
      { matcher: 'LLM judge', score: 83, matched: true, label: 'Same product, retail aggregator', ai: true },
    ],
  },
];

export const COMPETITOR_PRODUCTS: CompetitorProduct[] = [
  { id: 5001, monitoring_target_id: 101, competitor_source_id: 1, url: 'https://amazon.it/dp/B0XYZ', external_ref: 'B0XYZ', match_status: 'confirmed', match_confidence: 96, match_method: 'gtin', last_seen_at: '2026-05-24T18:10:00Z' },
  { id: 5002, monitoring_target_id: 101, competitor_source_id: 2, url: 'https://mediaworld.it/p/123', external_ref: '123', match_status: 'confirmed', match_confidence: 88, match_method: 'mpn', last_seen_at: '2026-05-24T18:05:00Z' },
  { id: 5003, monitoring_target_id: 101, competitor_source_id: 7, url: 'https://trovaprezzi.it/x', external_ref: null, match_status: 'suggested', match_confidence: 78, match_method: 'name', last_seen_at: '2026-05-24T17:50:00Z' },
];

export const ALERTS: Alert[] = [
  { id: 9001, type: 'price.dropped', severity: 'high', payload: { delta_pct: -12.4, host: 'trovaprezzi.it' }, product_id: 1, competitor_product_id: 5003, acknowledged_at: null, read: false, created_at: '2026-05-24T18:20:00Z' },
  { id: 9002, type: 'undercut.detected', severity: 'high', payload: { host: 'amazon.it' }, product_id: 1, competitor_product_id: 5001, acknowledged_at: null, read: false, created_at: '2026-05-24T18:05:00Z' },
  { id: 9003, type: 'stock.out', severity: 'medium', payload: { host: 'mediaworld.it' }, product_id: 3, competitor_product_id: null, acknowledged_at: null, read: true, created_at: '2026-05-24T17:30:00Z' },
  { id: 9004, type: 'promo.started', severity: 'low', payload: { host: 'eprice.it' }, product_id: 4, competitor_product_id: null, acknowledged_at: null, read: true, created_at: '2026-05-24T16:10:00Z' },
  { id: 9005, type: 'match.suggested', severity: 'low', payload: {}, product_id: 2, competitor_product_id: null, acknowledged_at: null, read: true, created_at: '2026-05-24T15:00:00Z' },
];

export const ANOMALIES: Anomaly[] = [
  { id: 8001, competitor_product_id: 5003, type: 'price_error', severity: 'high', evidence: { current_cents: 6590, median_cents: 74900 }, is_ai_generated: false, detected_at: '2026-05-24T18:20:00Z', acknowledged_at: null },
  { id: 8002, competitor_product_id: 5001, type: 'outlier', severity: 'medium', evidence: {}, is_ai_generated: true, detected_at: '2026-05-24T17:00:00Z', acknowledged_at: null },
  { id: 8003, competitor_product_id: 5002, type: 'batch_update', severity: 'low', evidence: {}, is_ai_generated: true, detected_at: '2026-05-24T14:00:00Z', acknowledged_at: null },
];

/** 30-day price series per competitor host for the dashboard market-trend chart. */
function series(base: number, drift: number, amp: number): PriceObservation[] {
  const start = new Date('2026-04-25T00:00:00Z').getTime();
  return Array.from({ length: 30 }, (_, i) => {
    const cents = Math.round(base + Math.sin(i / 3) * amp + i * drift);
    return {
      id: i + 1,
      competitor_product_id: 5001,
      captured_at: new Date(start + i * 86_400_000).toISOString(),
      price_cents: cents,
      currency: 'EUR',
      price_base_cents: cents,
      shipping_cents: 0,
      available: true,
    };
  });
}

export const PRICE_SERIES: Record<string, PriceObservation[]> = {
  'amazon.it': series(78000, -30, 1500),
  'mediaworld.it': series(80500, -10, 1200),
  'trovaprezzi.it': series(76000, -120, 1800),
  'unieuro.it': series(81000, -20, 900),
};

/** 30-day price series keyed by competitor_product_id (for Competitor Detail price tab). */
function seriesCp(cpId: number, base: number, drift: number, amp: number): PriceObservation[] {
  const start = new Date('2026-04-25T00:00:00Z').getTime();
  return Array.from({ length: 30 }, (_, i) => {
    const cents = Math.round(base + Math.sin(i / 3) * amp + i * drift);
    return {
      id: cpId * 100 + i,
      competitor_product_id: cpId,
      captured_at: new Date(start + i * 86_400_000).toISOString(),
      price_cents: cents,
      currency: 'EUR',
      price_base_cents: cents,
      shipping_cents: 0,
      available: true,
    };
  });
}

export const PRICE_SERIES_BY_CP: Record<number, PriceObservation[]> = {
  5001: seriesCp(5001, 76900, -30, 1200),
  5002: seriesCp(5002, 78900, -10, 800),
  5003: seriesCp(5003, 74900, -80, 1500),
  5004: seriesCp(5004, 124900, -50, 3000),
  5005: seriesCp(5005, 15900, 20, 400),
};

// ---- Intelligence (A5) ----

export const FORECASTS: Forecast[] = [
  { id: 7001, competitor_product_id: 5001, horizon_days: 14, forecast_price_cents: 74200, ci_low_cents: 71800, ci_high_cents: 76600, model_version: 'Statistical-MA-v2.1', is_ai_generated: true, generated_at: '2026-05-24T07:00:00Z' },
  { id: 7002, competitor_product_id: 5004, horizon_days: 14, forecast_price_cents: 123100, ci_low_cents: 119000, ci_high_cents: 127200, model_version: 'Statistical-MA-v2.1', is_ai_generated: true, generated_at: '2026-05-24T07:00:00Z' },
  { id: 7003, competitor_product_id: 5005, horizon_days: 30, forecast_price_cents: 16400, ci_low_cents: 15100, ci_high_cents: 17700, model_version: 'Statistical-MA-v2.1', is_ai_generated: true, generated_at: '2026-05-24T07:00:00Z' },
];

export const NARRATIVES: Narrative[] = [
  {
    id: 8101,
    period: '2026-W21',
    summary_md: '## Aggressive undercut on smartphones; TV category stabilizing.\n\nThe Italian smartphone market saw a coordinated price war this week — driven by Trovaprezzi and ePrice slashing the X1 Pro 128GB by up to 12%. Meanwhile TV stabilized after MediaWorld’s "TV Days" wound down. Three new competitor sites discovered. 27 alerts dispatched (4 high-severity).\n\n### Top movers (downward)\n- **Acme X1 Pro 128GB** · trovaprezzi.it −12.4% · €749 → €659\n- **Nova OLED 55"** · amazon.it −3.85% · €1,299 → €1,249\n\n### Suggested action\nInvestigate the Trovaprezzi civetta pattern (recurring Friday afternoons). Consider a counter-promo or temporary price-floor rule.',
    highlights: { alerts: 27, high_severity: 4, new_competitors: 3 },
    is_ai_generated: true,
    generated_at: '2026-05-18T07:02:00Z',
  },
  { id: 8100, period: '2026-W20', summary_md: '## Quiet week.\n\nPrices broadly stable; 11 alerts, no high-severity anomalies.', highlights: { alerts: 11, high_severity: 0 }, is_ai_generated: true, generated_at: '2026-05-11T07:01:00Z' },
];

export const ASSORTMENT_GAPS: AssortmentGap[] = [
  { id: 9201, competitor_source_id: 1, category_path: 'Smartphones', competitor_product_url: 'https://amazon.it/dp/B0AA', title: 'Rival Z9 256GB', importance_score: 92, status: 'open' },
  { id: 9202, competitor_source_id: 2, category_path: 'TV & Home', competitor_product_url: 'https://mediaworld.it/p/qled-65', title: 'Rival QLED 65"', importance_score: 78, status: 'open' },
  { id: 9203, competitor_source_id: 1, category_path: 'Audio', competitor_product_url: 'https://amazon.it/dp/B0AB', title: 'Rival SoundBar 5.1', importance_score: 64, status: 'open' },
  { id: 9204, competitor_source_id: 7, category_path: 'Wearables', competitor_product_url: 'https://trovaprezzi.it/w', title: 'Rival Band 9', importance_score: 55, status: 'reviewing' },
];

export const CONTENT_GAPS: ContentGap[] = [
  { id: 9301, product_id: 1, seo_score_delta: -34, missing_attributes: ['IP68 rating not mentioned', 'No 5G band list', 'Battery mAh missing'], title_recommendations: ['Acme X1 Pro 128GB 5G Smartphone — 6.7" 120Hz OLED, IP68, 65W'], description_recommendations: ['Lead with the 120Hz LTPO OLED and IP68; competitors all surface these in the first line.'], image_count_gap: 4, generated_at: '2026-05-24T06:00:00Z' },
  { id: 9302, product_id: 3, seo_score_delta: -18, missing_attributes: ['Panel type (OLED) not in title', 'No HDR format list'], title_recommendations: ['Nova OLED 55" 4K 120Hz Smart TV — Dolby Vision, HDR10+'], description_recommendations: ['Mention Dolby Vision + 120Hz; two competitors rank above us on these terms.'], image_count_gap: 2, generated_at: '2026-05-24T06:00:00Z' },
];

export const REVIEWS: ReviewInsight[] = [
  { id: 9401, competitor_product_id: 5001, period: '2026-W21', sentiment_score: 0.72, themes: [{ theme: 'Battery life', pos: 78, neg: 12, mentions: 612 }, { theme: 'Camera quality', pos: 81, neg: 8, mentions: 540 }, { theme: 'Display brightness', pos: 88, neg: 4, mentions: 421 }, { theme: 'Build quality', pos: 71, neg: 18, mentions: 388 }, { theme: 'Software / UX', pos: 52, neg: 28, mentions: 312 }], sample_count: 2148, is_ai_generated: true, generated_at: '2026-05-24T05:00:00Z' },
];

// ---- System (A6) ----

export const RULES: RepricingRule[] = [
  { id: 6001, name: 'Beat Amazon by 2% with margin floor', strategy: 'beat_top_n', target_filter: { categories: ['Smartphones'], countries: ['IT'] }, parameters: { top_n: 3, domains_priority: ['amazon.it'], delta_pct: -2, min_margin_pct: 18, max_change_per_day_pct: 5, round_to_charm: 0.99 }, priority: 10, status: 'active' },
  { id: 6002, name: 'Match cheapest on TV', strategy: 'match_cheapest', target_filter: { categories: ['TV & Home'], countries: ['IT'] }, parameters: { min_margin_pct: 12, max_change_per_day_pct: 8 }, priority: 20, status: 'active' },
  { id: 6003, name: 'Undercut 5% clearance', strategy: 'undercut_pct', target_filter: { categories: ['Audio'] }, parameters: { delta_pct: -5, min_margin_pct: 10 }, priority: 30, status: 'paused' },
];

export const RULE_DECISIONS: RuleDecision[] = [
  { id: 6101, repricing_rule_id: 6001, product_id: 1, current_price_cents: 79900, suggested_price_cents: 76900, applied: false, reason: 'beat amazon.it (€784) by 2% → €769.00 (margin floor 18% ok)' },
  { id: 6102, repricing_rule_id: 6002, product_id: 3, current_price_cents: 129900, suggested_price_cents: 124900, applied: false, reason: 'match cheapest amazon.it €1249' },
];

export const WEBHOOKS: WebhookSubscription[] = [
  { id: 7201, url: 'https://marginos.acme.it/webhooks/price-intel', events: ['price.changed', 'undercut.detected', 'buybox.lost', 'map.violated'], active: true, last_status: 200, last_at: '2026-05-24T11:34:18Z' },
  { id: 7202, url: 'https://hooks.slack.com/services/T0/B0/xxx', events: ['anomaly.detected', 'map.violated'], active: true, last_status: 200, last_at: '2026-05-24T11:32:18Z' },
  { id: 7203, url: 'https://eu.zapier.com/hooks/catch/123/abc', events: ['narrative.generated'], active: false, last_status: 410, last_at: '2026-05-24T11:30:02Z' },
];

export const API_KEYS: ApiKey[] = [
  { id: 8301, name: 'MarginOS production', scopes: ['catalog:read', 'observations:read', 'alerts:read'], last_used_at: '2026-05-24T11:30:00Z', expires_at: null, revoked_at: null, created_at: '2026-01-12T09:00:00Z' },
  { id: 8302, name: 'Analytics read-only', scopes: ['observations:read', 'forecasts:read'], last_used_at: '2026-05-20T08:00:00Z', expires_at: '2026-08-01T00:00:00Z', revoked_at: null, created_at: '2026-03-01T09:00:00Z' },
  { id: 8303, name: 'Legacy import (rotate)', scopes: ['catalog:write'], last_used_at: '2026-04-02T08:00:00Z', expires_at: null, revoked_at: '2026-05-01T00:00:00Z', created_at: '2025-11-01T09:00:00Z' },
];

export const AI_DECISIONS: AiDecision[] = [
  { id: 9101, subject_type: 'competitor_product', subject_id: 5003, feature: 'visual_match', model: 'gpt-4o-mini', model_version: '2026-04', confidence: 78, cost_micros: 1200, human_reviewed: true, output: { matched: true, reason: 'same product, different angle' }, created_at: '2026-05-25T17:50:00Z' },
  { id: 9102, subject_type: 'product', subject_id: 3, feature: 'content_gap', model: 'gpt-4o', model_version: '2026-04', confidence: 91, cost_micros: 4300, human_reviewed: false, output: { missing: ['HDR10+', 'panel_type'] }, created_at: '2026-05-25T16:20:00Z' },
  { id: 9103, subject_type: 'competitor_product', subject_id: 5005, feature: 'anomaly', model: 'statistical-v1', model_version: '1.0', confidence: 64, cost_micros: 0, human_reviewed: false, output: { type: 'price_spike', z: 3.4 }, created_at: '2026-05-25T15:05:00Z' },
  { id: 9104, subject_type: null, subject_id: null, feature: 'narrative', model: 'gpt-4o', model_version: '2026-04', confidence: null, cost_micros: 8800, human_reviewed: false, output: { period: '2026-W21' }, created_at: '2026-05-25T07:00:00Z' },
  { id: 9105, subject_type: 'competitor_product', subject_id: 5001, feature: 'visual_match', model: 'gpt-4o-mini', model_version: '2026-04', confidence: 96, cost_micros: 1100, human_reviewed: false, output: { matched: true }, created_at: '2026-05-24T18:10:00Z' },
];
