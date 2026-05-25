import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Price, PriceDelta, AiBadge } from '@/components/ds/pricing';
import { ForecastChart, type ForecastPoint } from '@/components/charts';
import { useCompetitors, useCompetitorPrices, useForecasts } from '@/hooks/operate';
import type { Forecast, PriceObservation } from '@/lib/api/types';

function historyPoints(obs: PriceObservation[] | undefined) {
  return (obs ?? [])
    .map((o) => ({ t: new Date(o.captured_at), price: o.price_base_cents ?? o.price_cents }))
    .filter((p): p is { t: Date; price: number } => p.price != null)
    .sort((a, b) => a.t.getTime() - b.t.getTime());
}

/** Project a display series from the last observed price to the forecasted endpoint, widening
 * the CI band linearly to the stored ci_low/ci_high. The endpoint values are the real model
 * output; the path between is an interpolation for visualisation only.
 * `startMs` must be the last-observed timestamp (or `generated_at`) so the x-axis does not
 * drift based on the viewer's local clock. */
function projectForecast(lastPrice: number | null, f: Forecast, startMs: number): ForecastPoint[] {
  if (lastPrice == null) return [];
  const target = f.forecast_price_cents;
  const lo = f.ci_low_cents ?? target;
  const hi = f.ci_high_cents ?? target;
  const steps = Math.max(2, Math.min(30, f.horizon_days));
  return Array.from({ length: steps }, (_, i) => {
    const frac = (i + 1) / steps;
    const price = Math.round(lastPrice + (target - lastPrice) * frac);
    const halfLo = (target - lo) * frac;
    const halfHi = (hi - target) * frac;
    return {
      t: new Date(startMs + (i + 1) * 86_400_000),
      price,
      low: Math.round(price - halfLo),
      high: Math.round(price + halfHi),
    };
  });
}

export function Forecasts() {
  const { data } = useForecasts();
  const forecasts = useMemo(() => data?.data ?? [], [data]);
  const competitors = useCompetitors();
  const productByCp = useMemo(() => {
    const m = new Map<number, { name: string; our: number | null }>();
    for (const c of competitors.data?.data ?? []) {
      if (c.target?.product) m.set(c.id, { name: c.target.product.name, our: c.target.product.our_price_cents });
    }
    return m;
  }, [competitors.data]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = forecasts.find((f) => f.id === selectedId) ?? forecasts[0] ?? null;
  const meta = selected ? productByCp.get(selected.competitor_product_id) : undefined;

  const prices = useCompetitorPrices(selected?.competitor_product_id ?? 0);
  const history = useMemo(() => historyPoints(prices.data?.data), [prices.data]);
  // Do NOT fall back to our own price — that would mislead the "Current competitor" KPI.
  const lastPrice = history.length ? history[history.length - 1].price : null;
  const startMs = history.length
    ? history[history.length - 1].t.getTime()
    : selected ? new Date(selected.generated_at).getTime() : Date.now();
  const forecastSeries = selected ? projectForecast(lastPrice, selected, startMs) : [];
  const current = lastPrice;
  const deltaPct = current != null && current !== 0 && selected ? ((selected.forecast_price_cents - current) / current) * 100 : null;

  return (
    <div className="page" data-testid="page-forecasts">
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Price forecasts
            <AiBadge size="lg" />
          </h1>
          <p className="page-sub">Statistical model (MA + seasonal index) with confidence interval. PHP-native — no Python microservice.</p>
        </div>
      </div>

      <div className="grid-21" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">All forecasts</h3>
            <span className="muted">{forecasts.length} active</span>
          </div>
          <div className="card-body flush">
            {forecasts.map((f) => {
              const isSel = selected?.id === f.id;
              const m = productByCp.get(f.competitor_product_id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className="cell-open-btn"
                  onClick={() => setSelectedId(f.id)}
                  style={{
                    display: 'block', width: '100%', padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: isSel ? 'var(--bg-active)' : 'transparent',
                    borderLeft: isSel ? '2px solid var(--text)' : '2px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m?.name ?? `CP #${f.competitor_product_id}`}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <span className="mono muted" style={{ fontSize: 11 }}>{f.horizon_days}d</span>
                    <span className="mono muted" style={{ fontSize: 11 }}>·</span>
                    <span className="mono muted" style={{ fontSize: 11 }}>{f.model_version}</span>
                  </div>
                </button>
              );
            })}
            {forecasts.length === 0 && <div className="empty">No forecasts</div>}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {meta?.name ?? `CP #${selected.competitor_product_id}`}
                      <AiBadge />
                    </h3>
                    <p className="card-sub">{selected.model_version} · {selected.horizon_days}-day horizon</p>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '8px 4px' }}>
                  <ForecastChart history={history} forecast={forecastSeries} ourPrice={meta?.our ?? undefined} height={300} />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: 14 }}>
                <div className="card"><div className="card-body">
                  <div className="kpi-label">Current</div>
                  {current != null ? <Price cents={current} size="lg" /> : '—'}
                </div></div>
                <div className="card"><div className="card-body">
                  <div className="kpi-label">Forecast</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <Price cents={selected.forecast_price_cents} size="lg" />
                    {deltaPct != null && <PriceDelta pct={deltaPct} vs="prev" />}
                  </div>
                </div></div>
                <div className="card"><div className="card-body">
                  <div className="kpi-label">Confidence interval</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    {selected.ci_low_cents != null && selected.ci_high_cents != null ? (
                      <>
                        <Price cents={selected.ci_low_cents} />
                        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                        <Price cents={selected.ci_high_cents} />
                      </>
                    ) : (
                      <span className="mono">—</span>
                    )}
                  </div>
                </div></div>
              </div>

              <div className="disclaimer">
                <I.AlertTriangle size={14} />
                <div>
                  <b>Forecast, not a guarantee.</b> Statistical prediction; past behaviour does not imply future certainty.
                  Per EU AI Act Art. 50 this output is flagged AI-generated and logged for audit (model {selected.model_version}).
                </div>
              </div>
            </>
          ) : (
            <div className="card"><div className="card-body empty">No forecasts available.</div></div>
          )}
        </div>
      </div>
    </div>
  );
}
