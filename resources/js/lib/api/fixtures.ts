// Dev/test fixtures shaped to the core v1.1 API types. Used by the mock layer only
// (useMocks) so screens render without a live backend. Not shipped behavior.
import type {
  Alert,
  Anomaly,
  CompetitorListItem,
  CompetitorProduct,
  MatchProposal,
  MonitoringTarget,
  PriceObservation,
  Product,
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
