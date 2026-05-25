import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Price, PriceDelta, HostChip } from '@/components/ds/pricing';
import { PriceLineChart, PriceDistribution, type PriceSeries } from '@/components/charts';
import { useCatalog, useCompetitors, usePriceSeries } from '@/hooks/operate';
import type { PriceObservation } from '@/lib/api/types';

const HOSTS: Array<{ host: string; color: string; thick?: boolean }> = [
  { host: 'amazon.it', color: 'var(--status-running)', thick: true },
  { host: 'mediaworld.it', color: 'var(--accent)' },
  { host: 'trovaprezzi.it', color: 'var(--price-cheaper)' },
  { host: 'unieuro.it', color: 'var(--text-tertiary)' },
];
const RANGES = ['7d', '30d', '90d', '1y'];

function toPoints(obs: PriceObservation[] | undefined) {
  return (obs ?? [])
    .map((o) => ({ t: new Date(o.captured_at), price: o.price_base_cents ?? o.price_cents }))
    .filter((p): p is { t: Date; price: number } => p.price != null)
    .sort((a, b) => a.t.getTime() - b.t.getTime());
}

export function Prices() {
  const catalog = useCatalog();
  const products = catalog.data?.data ?? [];
  const [productId, setProductId] = useState<number | null>(null);
  const [range, setRange] = useState('30d');
  const [active, setActive] = useState<Set<string>>(() => new Set(HOSTS.map((h) => h.host)));

  const selected = products.find((p) => p.id === productId) ?? products[0] ?? null;
  const ourPrice = selected?.our_price_cents ?? null;

  const amazon = usePriceSeries('amazon.it');
  const media = usePriceSeries('mediaworld.it');
  const trova = usePriceSeries('trovaprezzi.it');
  const unieuro = usePriceSeries('unieuro.it');
  const byHost: Record<string, PriceObservation[] | undefined> = {
    'amazon.it': amazon.data?.data,
    'mediaworld.it': media.data?.data,
    'trovaprezzi.it': trova.data?.data,
    'unieuro.it': unieuro.data?.data,
  };
  const series: PriceSeries[] = HOSTS.filter((h) => active.has(h.host))
    .map((h) => ({ id: h.host, name: h.host, color: h.color, thick: h.thick, data: toPoints(byHost[h.host]) }))
    .filter((s) => s.data.length > 0);

  const competitors = useCompetitors();
  const forProduct = useMemo(
    () => (competitors.data?.data ?? []).filter((c) => selected != null && c.target?.product_id === selected.id),
    [competitors.data, selected],
  );
  const distribution = forProduct
    .filter((c) => c.latest_price?.price_cents != null)
    .map((c) => ({ name: c.source?.host?.split('.')[0] ?? '?', price: c.latest_price!.price_cents! }));

  const toggleHost = (host: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(host)) next.delete(host);
      else next.add(host);
      return next;
    });

  return (
    <div className="page" data-testid="page-prices">
      <div className="page-head">
        <div>
          <h1 className="page-title">Prices explorer</h1>
          <p className="page-sub">Analytic playground over price observations. Partitioned monthly · 90d raw retention + ∞ daily aggregates.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn"><I.External size={13} /> Export CSV</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-row" style={{ margin: 0, minWidth: 280 }}>
            <label htmlFor="prices-product">Product</label>
            <select
              id="prices-product"
              className="select"
              value={selected?.id ?? ''}
              onChange={(e) => setProductId(Number(e.target.value))}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ margin: 0 }}>
            <label>Range</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RANGES.map((r) => (
                <button key={r} type="button" className={`chip ${range === r ? 'active' : ''}`} style={{ padding: '4px 12px' }} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="form-row" style={{ margin: 0, flex: 1, minWidth: 240 }}>
            <label>Competitors</label>
            <div className="tag-list">
              {HOSTS.map((h) => (
                <button
                  key={h.host}
                  type="button"
                  className={`chip ${active.has(h.host) ? 'active' : ''}`}
                  style={{ padding: '4px 10px' }}
                  aria-pressed={active.has(h.host)}
                  onClick={() => toggleHost(h.host)}
                >
                  {h.host}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">{selected?.name ?? 'Select a product'}</h3>
            <p className="card-sub">Multi-series price observations · {range} · our reference highlighted.</p>
          </div>
          {ourPrice != null && (
            <div>
              <small className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Your price</small>
              <div><Price cents={ourPrice} size="lg" /></div>
            </div>
          )}
        </div>
        <div className="card-body" style={{ padding: '8px 4px 4px' }}>
          {series.length > 0 ? (
            <PriceLineChart ourPrice={ourPrice ?? undefined} series={series} height={320} />
          ) : (
            <div className="empty">No price history for the selected competitors</div>
          )}
        </div>
      </div>

      <div className="grid-12" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Competitor prices</h3>
            <span className="muted">on {selected?.model ?? selected?.name ?? '—'}</span>
          </div>
          <div className="card-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Host</th>
                  <th className="right">Price</th>
                  <th className="right">vs us</th>
                </tr>
              </thead>
              <tbody>
                {forProduct.map((c) => {
                  const price = c.latest_price?.price_cents;
                  const pct = ourPrice != null && ourPrice !== 0 && price != null ? ((price - ourPrice) / ourPrice) * 100 : null;
                  return (
                    <tr key={c.id}>
                      <td>{c.source?.host ? <HostChip host={c.source.host} /> : '—'}</td>
                      <td className="right">{price != null ? <Price cents={price} /> : '—'}</td>
                      <td className="right">{pct != null ? <PriceDelta pct={pct} /> : '—'}</td>
                    </tr>
                  );
                })}
                {forProduct.length === 0 && (
                  <tr><td colSpan={3} className="empty">No competitor listings for this product</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Position vs competitors</h3>
            <p className="card-sub">on {selected?.name ?? '—'}</p>
          </div>
          <div className="card-body">
            {distribution.length > 0 ? (
              <PriceDistribution ourPrice={ourPrice} competitors={distribution} height={120} />
            ) : (
              <div className="empty">No competitor prices to plot</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
