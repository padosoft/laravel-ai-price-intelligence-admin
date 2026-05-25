import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Price, PriceDelta, AiBadge, ConfidenceBadge, HostChip } from '@/components/ds/pricing';
import { ProductImg } from '@/components/screens/shared';
import { PriceLineChart, type PriceSeries } from '@/components/charts';
import { useToast } from '@/components/ds';
import { useAnomalies, useCompetitorDetail, useCompetitorPrices, useFetchLogs, useTargetActions } from '@/hooks/operate';
import { safeHttpUrl } from '@/lib/url';
import type { PriceObservation } from '@/lib/api/types';
import type { RouteKey } from '@/lib/types';

type TabKey = 'price' | 'content' | 'stock' | 'promo' | 'anomalies' | 'audit';
const TABS: Array<[TabKey, string]> = [
  ['price', 'Price'],
  ['content', 'Content'],
  ['stock', 'Stock'],
  ['promo', 'Promo'],
  ['anomalies', 'Anomalies'],
  ['audit', 'Audit'],
];

function toPoints(obs: PriceObservation[] | undefined) {
  return (obs ?? [])
    .map((o) => ({ t: new Date(o.captured_at), price: o.price_base_cents ?? o.price_cents }))
    .filter((p): p is { t: Date; price: number } => p.price != null)
    .sort((a, b) => a.t.getTime() - b.t.getTime());
}

export function CompetitorDetail({
  competitorId,
  onNavigate,
}: {
  competitorId: number;
  onNavigate: (r: RouteKey, params?: Record<string, unknown>) => void;
}) {
  const [tab, setTab] = useState<TabKey>('price');
  const { data, isLoading, isError } = useCompetitorDetail(competitorId);
  const { scrapeNow } = useTargetActions();
  const toast = useToast();

  if (competitorId <= 0) {
    return (
      <div className="page" data-testid="page-competitor-detail">
        <button type="button" className="btn ghost sm" onClick={() => onNavigate('competitors')}>
          <I.ChevronLeft size={12} /> Back to competitors
        </button>
        <div className="card"><div className="card-body empty">Choose a competitor listing to inspect.</div></div>
      </div>
    );
  }

  if (isLoading) return <div className="page" data-testid="page-competitor-detail"><div className="card"><div className="card-body empty">Loading…</div></div></div>;
  if (isError || !data) {
    return (
      <div className="page" data-testid="page-competitor-detail">
        <button type="button" className="btn ghost sm" onClick={() => onNavigate('competitors')}>
          <I.ChevronLeft size={12} /> Back to competitors
        </button>
        <div className="card"><div className="card-body empty">Listing not found.</div></div>
      </div>
    );
  }

  const cp = data.competitor_product;
  const product = cp.target?.product ?? null;
  const our = product?.our_price_cents ?? null;
  const price = data.latest_price?.price_cents ?? null;
  const pct = our != null && our !== 0 && price != null ? ((price - our) / our) * 100 : null;
  const host = cp.source?.host ?? '—';
  const listingHref = safeHttpUrl(cp.url);

  return (
    <div className="page" data-testid="page-competitor-detail">
      <div className="page-head">
        <div>
          <button type="button" className="btn ghost sm" onClick={() => onNavigate('competitors')} style={{ marginBottom: 10 }}>
            <I.ChevronLeft size={12} /> Back to competitors
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ProductImg img={product?.brand?.slice(0, 2)} lg />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <HostChip host={host} />
                {cp.match_confidence != null && <ConfidenceBadge value={cp.match_confidence} label="conf" />}
                <span className="badge success"><span className="dot" />{cp.match_status}</span>
                <span className="mono tertiary" style={{ fontSize: 11 }}>#{cp.id}</span>
              </div>
              <h1 className="page-title" style={{ marginBottom: 4 }}>{product?.name ?? cp.url}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
                {listingHref ? (
                  <a href={listingHref} className="id-link mono" target="_blank" rel="noreferrer noopener">{cp.url}</a>
                ) : (
                  <span className="mono tertiary">{cp.url}</span>
                )}
                {cp.external_ref && <span className="mono tertiary">ext: {cp.external_ref}</span>}
                {cp.match_method && <span className="muted">matched via <span className="mono">{cp.match_method}</span></span>}
              </div>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn"
            disabled={scrapeNow.isPending}
            onClick={() =>
              scrapeNow.mutate(cp.monitoring_target_id, {
                onSuccess: (res) => toast.push({ title: 'Scrape queued', body: `${res.data.queued} competitor(s)` }),
                onError: () => toast.push({ title: 'Scrape failed', kind: 'error' }),
              })
            }
          >
            <I.Refresh size={13} /> Scrape now
          </button>
          {listingHref ? (
            <a className="btn" href={listingHref} target="_blank" rel="noreferrer noopener">
              <I.External size={13} /> Open listing
            </a>
          ) : (
            <button type="button" className="btn" disabled title="No openable URL">
              <I.External size={13} /> Open listing
            </button>
          )}
        </div>
      </div>

      <div className="stat-row" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="stat">
          <small>Current price</small>
          <b>{price != null ? <Price cents={price} /> : '—'}</b>
        </div>
        <div className="stat">
          <small>vs our</small>
          <b>{pct != null ? <PriceDelta pct={pct} /> : '—'}</b>
        </div>
        <div className="stat">
          <small>Our retail</small>
          <b>{our != null ? <Price cents={our} /> : '—'}</b>
        </div>
        <div className="stat">
          <small>Stock</small>
          <b style={{ color: data.latest_price?.available === true ? 'var(--status-success)' : data.latest_price?.available === false ? 'var(--status-failed)' : 'var(--text-tertiary)' }}>
            {data.latest_price?.available === true ? 'In stock' : data.latest_price?.available === false ? 'Out' : '—'}
          </b>
        </div>
        <div className="stat">
          <small>Last seen</small>
          <b>{cp.last_seen_at ? cp.last_seen_at.slice(0, 16).replace('T', ' ') : '—'}</b>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 12 }}>
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)} aria-current={tab === k}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'price' && <PriceTab competitorId={competitorId} host={host} ourPrice={our} />}
      {tab === 'content' && <SnapshotTab title="Content snapshot" snapshot={data.latest_content} />}
      {tab === 'stock' && <SnapshotTab title="Latest stock" snapshot={data.latest_stock} />}
      {tab === 'promo' && <SnapshotTab title="Latest promo" snapshot={data.latest_promo} />}
      {tab === 'anomalies' && <AnomaliesTab competitorId={competitorId} />}
      {tab === 'audit' && <AuditTab host={host} />}
    </div>
  );
}

function PriceTab({ competitorId, host, ourPrice }: { competitorId: number; host: string; ourPrice: number | null }) {
  const { data } = useCompetitorPrices(competitorId);
  const obs = data?.data;
  const points = useMemo(() => toPoints(obs), [obs]);
  const series: PriceSeries[] = points.length
    ? [{ id: 'cur', name: host, color: 'var(--status-running)', thick: true, data: points }]
    : [];
  const rows = useMemo(() => (obs ?? []).slice().sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()).slice(0, 10), [obs]);

  return (
    <>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Price history</h3>
            <p className="card-sub">Observation series with our retail reference line.</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: '8px 4px' }}>
          {series.length > 0 ? (
            <PriceLineChart ourPrice={ourPrice ?? undefined} series={series} height={300} />
          ) : (
            <div className="empty">No price history yet</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head"><h3 className="card-title">Observations · last 10</h3></div>
        <div className="card-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Captured at</th>
                <th className="right">Price</th>
                <th className="right">Δ vs prev</th>
                <th>Shipping</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o, i) => {
                const prev = rows[i + 1];
                const delta = prev?.price_cents != null && o.price_cents != null && prev.price_cents !== 0
                  ? ((o.price_cents - prev.price_cents) / prev.price_cents) * 100
                  : null;
                return (
                  <tr key={o.id}>
                    <td className="mono">{o.captured_at.slice(0, 19).replace('T', ' ')}</td>
                    <td className="right">{o.price_cents != null ? <Price cents={o.price_cents} /> : '—'}</td>
                    <td className="right">{delta != null ? <PriceDelta pct={delta} /> : <span className="muted">—</span>}</td>
                    <td className="mono">{o.shipping_cents != null ? `€${(o.shipping_cents / 100).toFixed(2)}` : '—'}</td>
                    <td><span className={`badge ${o.available === true ? 'success' : o.available === false ? 'failed' : 'pending'}`} style={{ fontSize: 10 }}><span className="dot" />{o.available === true ? 'in' : o.available === false ? 'out' : '—'}</span></td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="empty">No observations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SnapshotTab({ title, snapshot }: { title: string; snapshot: Record<string, unknown> | null }) {
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-head"><h3 className="card-title">{title}</h3></div>
      <div className="card-body">
        {snapshot ? (
          <pre className="code-block" style={{ fontSize: 11 }}>{JSON.stringify(snapshot, null, 2)}</pre>
        ) : (
          <div className="empty">No snapshot captured yet.</div>
        )}
      </div>
    </div>
  );
}

function AnomaliesTab({ competitorId }: { competitorId: number }) {
  const { data } = useAnomalies(50);
  const items = (data?.data ?? []).filter((a) => a.competitor_product_id === competitorId);
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-head"><h3 className="card-title">Anomalies on this listing</h3></div>
      <div className="card-body flush">
        {items.length === 0 && <div className="empty">No anomalies in the retention window.</div>}
        {items.map((a) => (
          <div key={a.id} className="mini-card">
            <span className={`badge ${a.severity === 'high' ? 'failed' : a.severity === 'medium' ? 'paused' : 'pending'}`}>
              <span className="dot" />{a.type}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                {a.type}
                {a.is_ai_generated && <AiBadge />}
              </div>
            </div>
            <span className="mono tertiary" style={{ fontSize: 11 }}>{a.detected_at.slice(0, 16).replace('T', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab({ host }: { host: string }) {
  const { data } = useFetchLogs(20);
  const rows = (data?.data ?? []).filter((r) => r.url.includes(host)).slice(0, 10);
  const shown = rows.length > 0 ? rows : (data?.data ?? []).slice(0, 10);
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-head">
        <h3 className="card-title">Fetch audit log</h3>
        <span className="muted" style={{ fontSize: 11 }}>retention 90d · GDPR-compliant</span>
      </div>
      <div className="card-body flush">
        {shown.length === 0 && <div className="empty">No fetch logs.</div>}
        {shown.map((r) => (
          <div key={r.id} className="audit-log-row">
            <span className="mono">{r.captured_at.slice(0, 19).replace('T', ' ')}</span>
            <span className={`badge ${r.status != null && r.status < 300 ? 'success' : r.status != null && r.status < 500 ? 'paused' : 'failed'}`}>
              <span className="dot" />{r.status ?? '—'}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {r.driver ?? 'generic'} · {r.latency_ms ?? '—'}ms
            </span>
            <span className="muted" style={{ fontSize: 10.5 }}>
              robots: <span className="mono" style={{ color: r.robots_allowed ? 'var(--status-success)' : 'var(--status-failed)' }}>{r.robots_allowed ? 'allow' : 'deny'}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
