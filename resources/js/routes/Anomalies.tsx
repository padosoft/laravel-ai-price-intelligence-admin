import { useMemo, useState } from 'react';
import { AiBadge } from '@/components/ds/pricing';
import { AnomalyScatter, type ScatterPoint } from '@/components/charts';
import { useToast } from '@/components/ds';
import { useAnomalies, useAnomalyActions, useCompetitorPrices } from '@/hooks/operate';
import type { Anomaly } from '@/lib/api/types';

const SEV_BADGE: Record<string, string> = { high: 'failed', medium: 'paused', low: 'pending' };

function evidenceSummary(evidence: Record<string, unknown> | null): string {
  if (!evidence) return '—';
  return Object.entries(evidence)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

export function Anomalies() {
  const { data, isLoading } = useAnomalies(100);
  const anomalies = useMemo(() => data?.data ?? [], [data]);
  const [typeFilter, setTypeFilter] = useState('all');
  const { ack, ackBulk } = useAnomalyActions();
  const toast = useToast();

  const types = useMemo(() => ['all', ...new Set(anomalies.map((a) => a.type))], [anomalies]);
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of anomalies) m.set(a.type, (m.get(a.type) ?? 0) + 1);
    return m;
  }, [anomalies]);
  const filtered = typeFilter === 'all' ? anomalies : anomalies.filter((a) => a.type === typeFilter);
  const unackedIds = filtered.filter((a) => a.acknowledged_at == null).map((a) => a.id);

  const onAck = (id: number) =>
    ack.mutate(id, {
      onSuccess: () => toast.push({ title: 'Anomaly acknowledged' }),
      onError: () => toast.push({ title: 'Acknowledge failed', kind: 'error' }),
    });

  const onBulkAck = () =>
    ackBulk.mutate(unackedIds, {
      onSuccess: (res) => toast.push({ title: 'Bulk acknowledge complete', body: `${res.data.acknowledged} anomaly(ies)` }),
      onError: () => toast.push({ title: 'Bulk acknowledge failed', kind: 'error' }),
    });

  // Scatter: plot the price series of the listing with the most anomalies, marking the
  // observations whose capture day coincides with a detected anomaly.
  const focusCp = useMemo(() => {
    const counts = new Map<number, number>();
    for (const a of anomalies) counts.set(a.competitor_product_id, (counts.get(a.competitor_product_id) ?? 0) + 1);
    let best = 0;
    let bestN = 0;
    for (const [cp, n] of counts) if (n > bestN) { best = cp; bestN = n; }
    return best;
  }, [anomalies]);
  const prices = useCompetitorPrices(focusCp);
  // Precompute a day → anomaly map for the focused listing (O(observations + anomalies)
  // instead of a per-point linear scan).
  const anomalyByDay = useMemo(() => {
    const m = new Map<string, Anomaly>();
    for (const a of anomalies) if (a.competitor_product_id === focusCp) m.set(a.detected_at.slice(0, 10), a);
    return m;
  }, [anomalies, focusCp]);
  const scatter: ScatterPoint[] = (prices.data?.data ?? [])
    .map((o) => ({ o, price: o.price_base_cents ?? o.price_cents }))
    .filter((x): x is { o: typeof x.o; price: number } => x.price != null)
    .map(({ o, price }) => {
      const hit = anomalyByDay.get(o.captured_at.slice(0, 10));
      return {
        t: new Date(o.captured_at),
        price,
        anomaly: hit != null,
        sev: hit?.severity,
        label: hit?.type ?? '',
      };
    })
    .sort((a, b) => a.t.getTime() - b.t.getTime());

  return (
    <div className="page" data-testid="page-anomalies">
      <div className="page-head">
        <div>
          <h1 className="page-title">Anomaly detection</h1>
          <p className="page-sub">
            Statistical outlier detection + LLM judge for borderline cases. Each detection is logged for EU AI Act audit.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" disabled={unackedIds.length === 0 || ackBulk.isPending} onClick={onBulkAck}>
            {ackBulk.isPending ? 'Acknowledging…' : `Bulk acknowledge${unackedIds.length ? ` (${unackedIds.length})` : ''}`}
          </button>
        </div>
      </div>

      <div className="grid-12">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Price scatter · most-flagged listing</h3>
              <p className="card-sub">Observation series with detected anomalies enlarged &amp; labelled.</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: '8px 4px' }}>
            {scatter.length > 0 ? <AnomalyScatter data={scatter} height={280} /> : <div className="empty">No observations to plot</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3 className="card-title">Detection types</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...typeCounts.entries()].map(([k, n]) => {
                const pct = anomalies.length ? (n / anomalies.length) * 100 : 0;
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: 12 }}>{k}</span>
                      <span className="mono" style={{ fontSize: 12 }}>{n}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--status-paused)' }} />
                    </div>
                  </div>
                );
              })}
              {typeCounts.size === 0 && <div className="empty">No anomalies</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="filter-bar" style={{ marginTop: 18 }}>
        {types.map((t) => (
          <button key={t} type="button" className={`chip ${typeFilter === t ? 'active' : ''}`} aria-pressed={typeFilter === t} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'All types' : t}
            <span className="count">{t === 'all' ? anomalies.length : (typeCounts.get(t) ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Detection</th>
                <th>Listing</th>
                <th>Evidence</th>
                <th>Severity</th>
                <th>Detected</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: Anomaly) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{a.type}</span>
                      {a.is_ai_generated && <AiBadge />}
                    </div>
                  </td>
                  <td className="mono muted">CP #{a.competitor_product_id}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420 }}>{evidenceSummary(a.evidence)}</td>
                  <td>
                    <span className={`badge ${SEV_BADGE[a.severity] ?? 'pending'}`}>
                      <span className="dot" />{a.severity}
                    </span>
                  </td>
                  <td className="mono muted">{a.detected_at.slice(0, 16).replace('T', ' ')}</td>
                  <td>
                    <button type="button" className="btn sm" disabled={a.acknowledged_at != null || ack.isPending} onClick={() => onAck(a.id)}>
                      {a.acknowledged_at != null ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="empty">No anomalies</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
