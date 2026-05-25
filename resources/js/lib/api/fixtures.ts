// Dev/test fixtures shaped to the core v1.1 API types. Used by the mock layer only
// (useMocks) so screens render without a live backend. Not shipped behavior.
import type {
  Alert,
  Anomaly,
  CompetitorProduct,
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
