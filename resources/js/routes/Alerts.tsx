import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { KpiTile, AlertFeedRow } from '@/components/screens/shared';
import { useToast } from '@/components/ds';
import { useAlerts, useAlertActions } from '@/hooks/operate';
import type { Severity } from '@/lib/api/types';

const SEVERITIES: Array<Severity | 'all'> = ['all', 'high', 'medium', 'low'];
const ACK_FILTERS = ['all', 'unacked', 'acked'] as const;

export function Alerts() {
  const { data, isLoading } = useAlerts(100);
  const all = useMemo(() => data?.data ?? [], [data]);
  const { ack } = useAlertActions();
  const toast = useToast();

  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [ackFilter, setAckFilter] = useState<(typeof ACK_FILTERS)[number]>('unacked');

  const rows = all.filter((a) => {
    if (sev !== 'all' && a.severity !== sev) return false;
    if (ackFilter === 'unacked' && a.acknowledged_at != null) return false;
    if (ackFilter === 'acked' && a.acknowledged_at == null) return false;
    return true;
  });

  const unacked = all.filter((a) => a.acknowledged_at == null).length;
  const high = all.filter((a) => a.severity === 'high').length;

  return (
    <div className="page" data-testid="page-alerts">
      <div className="page-head">
        <div>
          <h1 className="page-title">Alerts inbox</h1>
          <p className="page-sub">
            Real-time stream from <span className="mono">/api/v1/alerts/stream</span> (SSE). Channels: webhook, mail, Slack, Teams.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn"><I.Settings size={13} /> Channels</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiTile label="Total" value={String(all.length)} />
        <KpiTile label="Unacknowledged" value={String(unacked)} sparkColor="var(--price-cheaper)" />
        <KpiTile label="High severity" value={String(high)} />
        <KpiTile label="Channels" value="4" delta="webhook · mail · Slack · Teams" />
      </div>

      <div className="filter-bar">
        {ACK_FILTERS.map((f) => (
          <button key={f} type="button" className={`chip ${ackFilter === f ? 'active' : ''}`} aria-pressed={ackFilter === f} onClick={() => setAckFilter(f)}>{f}</button>
        ))}
        <span style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 6px' }} />
        {SEVERITIES.map((s) => (
          <button key={s} type="button" className={`chip ${sev === s ? 'active' : ''}`} aria-pressed={sev === s} onClick={() => setSev(s)}>
            {s === 'all' ? 'All severity' : s}
            {s !== 'all' && <span className="count">{all.filter((a) => a.severity === s).length}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          {!isLoading && rows.length === 0 && <div className="empty">No alerts match your filters.</div>}
          {rows.map((a, i) => (
            <AlertFeedRow
              key={a.id}
              alert={a}
              fresh={i < 2 && a.acknowledged_at == null}
              onClick={() => {
                if (a.acknowledged_at != null) return;
                ack.mutate(a.id, {
                  onSuccess: () => toast.push({ title: 'Alert acknowledged', body: `#${a.id}` }),
                  onError: () => toast.push({ title: 'Acknowledge failed', kind: 'error' }),
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
