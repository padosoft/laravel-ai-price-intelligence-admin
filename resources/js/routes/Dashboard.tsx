import { useQueryClient } from '@tanstack/react-query';
import { I } from '@/components/ds/icons';
import { AiBadge, PriceDelta } from '@/components/ds/pricing';
import { PriceLineChart, StackedBar, type PriceSeries } from '@/components/charts';
import { KpiTile, AlertFeedRow } from '@/components/screens/shared';
import { useToast } from '@/components/ds';
import { useStats } from '@/hooks/useStats';
import { useAlerts, useAnomalies, printDocument, usePriceSeries } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { RouteKey } from '@/lib/types';
import type { PriceObservation } from '@/lib/api/types';

const CHART_HOSTS: Array<{ id: string; host: string; name: string; color: string; thick?: boolean }> = [
  { id: 'a', host: 'amazon.it', name: 'Amazon.it', color: 'var(--status-running)', thick: true },
  { id: 'm', host: 'mediaworld.it', name: 'MediaWorld', color: 'var(--accent)' },
  { id: 't', host: 'trovaprezzi.it', name: 'Trovaprezzi', color: 'var(--price-cheaper)' },
  { id: 'u', host: 'unieuro.it', name: 'Unieuro', color: 'var(--text-tertiary)' },
];

function toPoints(obs: PriceObservation[] | undefined) {
  return (obs ?? [])
    .map((o) => ({ t: new Date(o.captured_at), price: o.price_base_cents ?? o.price_cents }))
    .filter((p): p is { t: Date; price: number } => p.price != null) // drop unpriced points
    .sort((a, b) => a.t.getTime() - b.t.getTime());
}

export function Dashboard({ onNavigate }: { onNavigate: (r: RouteKey) => void }) {
  const stats = useStats();
  const alerts = useAlerts(5);
  const anomalies = useAnomalies(4);
  const amazon = usePriceSeries('amazon.it');
  const media = usePriceSeries('mediaworld.it');
  const trova = usePriceSeries('trovaprezzi.it');
  const unieuro = usePriceSeries('unieuro.it');

  const seriesByHost: Record<string, PriceObservation[] | undefined> = {
    'amazon.it': amazon.data?.data,
    'mediaworld.it': media.data?.data,
    'trovaprezzi.it': trova.data?.data,
    'unieuro.it': unieuro.data?.data,
  };
  const series: PriceSeries[] = CHART_HOSTS.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    thick: h.thick,
    data: toPoints(seriesByHost[h.host]),
  })).filter((s) => s.data.length > 0);

  const qc = useQueryClient();
  const toast = useToast();
  const refresh = () => {
    // Only the queries this dashboard renders — not every cache (identity/settings/etc.).
    for (const key of [['stats'], ['alerts'], ['anomalies'], ['observations']]) {
      void qc.invalidateQueries({ queryKey: key });
    }
    toast.push({ title: 'Refreshing', body: 'Re-fetching live metrics…' });
  };
  const exportDigest = () => { toast.push({ title: 'Preparing digest', body: 'Opening the print dialog…' }); printDocument(); };

  const s = stats.data;
  const distrib = [
    { label: 'Cheaper than us', value: 28, color: 'var(--price-cheaper)' },
    { label: 'At parity', value: 18, color: 'var(--price-parity)' },
    { label: 'Pricier than us', value: 54, color: 'var(--price-pricier)' },
  ];

  return (
    <div className="page" data-testid="page-dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Real-time competitive intelligence across your monitored markets.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={refresh}>
            <I.Refresh size={13} /> Refresh
          </button>
          <button type="button" className="btn" onClick={exportDigest}>
            <I.FileText size={13} /> Export digest
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Active targets" value={s ? fmtNum(s.targets_active) : '—'} />
        <KpiTile label="Competitor listings" value={s ? fmtNum(s.competitors_monitored) : '—'} />
        <KpiTile label="Alerts · 24h" value={s ? String(s.alerts_24h) : '—'} delta={s ? `${s.alerts_unacknowledged} unacked` : undefined} trend="up" sparkColor="var(--price-cheaper)" />
        <KpiTile label="Anomalies · 24h" value={s ? String(s.anomalies_24h) : '—'} sparkColor="var(--price-cheaper)" />
      </div>

      <div className="grid-12">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Market price trend</h3>
              <p className="card-sub">30-day view across competitors. Reference line: your retail price.</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: '8px 4px 4px' }}>
            {series.length > 0 ? (
              <PriceLineChart ourPrice={79900} series={series} height={260} />
            ) : (
              <div className="empty">No price history yet</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Your price position</h3>
              <p className="card-sub">Across all SKUs</p>
            </div>
          </div>
          <div className="card-body">
            <StackedBar segments={distrib} height={22} />
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 8px', fontSize: 12 }}>
              {distrib.map((d) => (
                <div key={d.label} style={{ display: 'contents' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: d.color, width: 8, height: 8, borderRadius: 2, display: 'inline-block' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                  </span>
                  <span className="mono" style={{ color: 'var(--text)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Top mover this week</span>
              <PriceDelta pct={-12.4} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-111" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <span className="live-pill" style={{ marginRight: 8, fontSize: 10 }}>
                <span className="pulse" />
                Live
              </span>
              Latest alerts
            </h3>
            <button type="button" className="btn ghost sm" onClick={() => onNavigate('alerts')}>
              View all <I.ChevronRight size={12} />
            </button>
          </div>
          <div className="card-body flush">
            {(alerts.data?.data ?? []).slice(0, 5).map((a, i) => (
              <AlertFeedRow key={a.id} alert={a} fresh={i < 2} onClick={() => onNavigate('alerts')} />
            ))}
            {(alerts.data?.data?.length ?? 0) === 0 && <div className="empty">No alerts</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Latest anomalies</h3>
            <button type="button" className="btn ghost sm" onClick={() => onNavigate('anomalies')}>
              View all <I.ChevronRight size={12} />
            </button>
          </div>
          <div className="card-body flush">
            {(anomalies.data?.data ?? []).slice(0, 4).map((an) => (
              <div key={an.id} className="mini-card">
                <span className={`badge ${an.severity === 'high' ? 'failed' : an.severity === 'medium' ? 'paused' : 'pending'}`}>
                  <span className="dot" />
                  {an.type}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    CP #{an.competitor_product_id}
                    {an.is_ai_generated && <AiBadge />}
                  </div>
                </div>
              </div>
            ))}
            {(anomalies.data?.data?.length ?? 0) === 0 && <div className="empty">No anomalies</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              This week's narrative
              <AiBadge />
            </h3>
            <button type="button" className="btn ghost sm" onClick={() => onNavigate('narrative')}>
              Open <I.ChevronRight size={12} />
            </button>
          </div>
          <div className="card-body">
            <p className="muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>
              The weekly AI digest of price moves, promos and assortment changes appears here once generated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
